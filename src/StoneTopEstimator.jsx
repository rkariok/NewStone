return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-6xl space-y-6 text-center">
        
        <div className="text-center mb-4">
          <div className="w-32 h-32 mx-auto mb-2 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-4xl font-bold text-gray-600">AIC</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Stone Estimator with Slab Optimization</h1>
          <p className="text-base font-medium text-gray-700">Developed by Roy Kariok</p>
        </div>

        {!adminMode && (
          <div className="mb-4">
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Admin Password"
              className="border px-4 py-2 rounded"
            />
            <button
              onClick={() => setAdminMode(adminPassword === correctPassword)}
              className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Enter Admin Mode
            </button>
          </div>
        )}

        {/* Advanced Settings Panel */}
        <div className="bg-blue-50 p-4 rounded shadow-md space-y-4 text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-blue-800">Optimization Settings</h2>
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {showAdvancedSettings ? '▼ Hide Advanced' : '▶ Show Advanced'}
            </button>
          </div>
          
          {/* Basic Settings - Always Visible */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="includeKerf"
                checked={includeKerf}
                onChange={(e) => setIncludeKerf(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="includeKerf" className="font-medium">
                Include Kerf (Saw Blade Width)
              </label>
              {includeKerf && (
                <span className="text-sm text-gray-600">({kerfWidth}")</span>
              )}
            </div>
            
            <div className="text-sm text-gray-600">
              <strong>Current Mode:</strong> {includeKerf ? 'Production (with kerf)' : 'Theoretical (no kerf)'}
            </div>
          </div>

          {/* Advanced Settings - Collapsible */}
          {showAdvancedSettings && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kerf Width (inches)</label>
                  <select
                    value={kerfWidth}
                    onChange={(e) => setKerfWidth(parseFloat(e.target.value))}
                    className="border px-3 py-2 rounded w-full text-sm"
                    disabled={!includeKerf}
                  >
                    <option value={0.125}>1/8" (0.125) - Standard</option>
                    <option value={0.1875}>3/16" (0.1875) - Thick Material</option>
                    <option value={0.25}>1/4" (0.25) - Heavy Duty</option>
                    <option value={0.09375}>3/32" (0.094) - Thin Blade</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Breakage Buffer (%)</label>
                  <select
                    value={breakageBuffer}
                    onChange={(e) => setBreakageBuffer(parseInt(e.target.value))}
                    className="border px-3 py-2 rounded w-full text-sm"
                  >
                    <option value={5}>5% - Conservative</option>
                    <option value={10}>10% - Standard</option>
                    <option value={15}>15% - High Risk</option>
                    <option value={20}>20% - Very High Risk</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Quick Presets</label>
                  <select
                    onChange={(e) => {
                      const preset = e.target.value;
                      if (preset === 'production') {
                        setIncludeKerf(true);
                        setKerfWidth(0.125);
                        setBreakageBuffer(10);
                      } else if (preset === 'theoretical') {
                        setIncludeKerf(false);
                        setBreakageBuffer(5);
                      } else if (preset === 'conservative') {
                        setIncludeKerf(true);
                        setKerfWidth(0.1875);
                        setBreakageBuffer(15);
                      }
                    }}
                    className="border px-3 py-2 rounded w-full text-sm"
                  >
                    <option value="">Select Preset...</option>
                    <option value="theoretical">Theoretical Maximum</option>
                    <option value="production">Production Standard</option>
                    <option value="conservative">Conservative Estimate</option>
                  </select>
                </div>
              </div>
              
              <div className="bg-gray-100 p-3 rounded text-sm">
                <strong>Settings Help:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>Kerf:</strong> Accounts for material lost to saw blade width</li>
                  <li><strong>Breakage Buffer:</strong> Extra material for handling/installation damage</li>
                  <li><strong>Production Mode:</strong> Most realistic for actual fabrication</li>
                  <li><strong>Theoretical Mode:</strong> Maximum possible pieces (no cutting waste)</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {products.map((product, index) => (
          <div key={product.id} className="bg-gray-50 p-4 rounded shadow space-y-4 text-left relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <h3 className="font-semibold text-gray-700">
                  {product.customName || `Product ${index + 1}`}
                </h3>
                {product.priority === 'high' && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">High Priority</span>
                )}
                {product.priority === 'low' && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Low Priority</span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAdvancedPieceManagement(!showAdvancedPieceManagement)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  title="Advanced Options"
                >
                  ⚙️
                </button>
                {products.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProduct(index)}
                    className="text-red-600 font-bold text-xl hover:text-red-800"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            
            {/* Advanced Piece Management */}
            {showAdvancedPieceManagement && (
              <div className="bg-blue-50 p-3 rounded border space-y-3">
                <h4 className="font-medium text-blue-800">Advanced Piece Settings</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Custom Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Kitchen Island, Master Bath"
                      value={product.customName || ""}
                      onChange={(e) => updateProduct(index, 'customName', e.target.value)}
                      className="border px-3 py-2 rounded w-full text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      value={product.priority || 'normal'}
                      onChange={(e) => updateProduct(index, 'priority', e.target.value)}
                      className="border px-3 py-2 rounded w-full text-sm"
                    >
                      <option value="high">High Priority</option>
                      <option value="normal">Normal</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Project Phase</label>
                    <select
                      value={product.projectPhase || 'design'}
                      onChange={(e) => updateProduct(index, 'projectPhase', e.target.value)}
                      className="border px-3 py-2 rounded w-full text-sm"
                    >
                      <option value="design">Design Phase</option>
                      <option value="approved">Approved</option>
                      <option value="production">In Production</option>
                      <option value="complete">Complete</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Installation Date</label>
                    <input
                      type="date"
                      value={product.installDate || ""}
                      onChange={(e) => updateProduct(index, 'installDate', e.target.value)}
                      className="border px-3 py-2 rounded w-full text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Special Requirements</label>
                    <select
                      value={product.specialReq || 'none'}
                      onChange={(e) => updateProduct(index, 'specialReq', e.target.value)}
                      className="border px-3 py-2 rounded w-full text-sm"
                    >
                      <option value="none">None</option>
                      <option value="book-match">Book Match Required</option>
                      <option value="quarter-match">Quarter Match</option>
                      <option value="vein-direction">Specific Vein Direction</option>
                      <option value="defect-free">Defect-Free Zone</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4">
              <select
                value={product.stone}
                onChange={(e) => updateProduct(index, 'stone', e.target.value)}
                className="border px-4 py-2 rounded"
              >
                <option value="">Select Stone Type...</option>
                {stoneOptions.map((stone, i) => (
                  <option key={i} value={stone["Stone Type"]}>{stone["Stone Type"]}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Width (in)"
                value={product.width}
                onChange={(e) => updateProduct(index, 'width', e.target.value)}
                className="border px-4 py-2 rounded"
              />
              <input
                type="number"
                placeholder="Depth (in)"
                value={product.depth}
                onChange={(e) => updateProduct(index, 'depth', e.target.value)}
                className="border px-4 py-2 rounded"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <input
                type="number"
                placeholder="Quantity"
                value={product.quantity}
                onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                className="border px-4 py-2 rounded"
              />
              <select
                value={product.edgeDetail}
                onChange={(e) => updateProduct(index, 'edgeDetail', e.target.value)}
                className="border px-4 py-2 rounded"
              >
                <option value="Eased">Eased</option>
                <option value="1.5 mitered">1.5" mitered</option>
                <option value="Bullnose">Bullnose</option>
                <option value="Ogee">Ogee</option>
                <option value="Beveled">Beveled</option>
              </select>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleDrawingUpload(e, index)}
                className="border px-4 py-2 rounded"
                disabled={loadingAI}
              />
            </div>

            {loadingAI && (
              <div className="text-blue-600 font-medium">
                🤖 AI is extracting dimensions from your drawing...
              </div>
            )}

            <textarea
              placeholder="Notes (optional)"
              value={product.note || ""}
              onChange={(e) => updateProduct(index, 'note', e.target.value)}
              className="w-full border p-2 rounded mt-2"
              rows={2}
            />
          </div>
        ))}

        <div className="flex space-x-4 justify-center">
          <button
            onClick={addProduct}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Another Product
          </button>
          
          <button
            onClick={() => setShowAdvancedPieceManagement(!showAdvancedPieceManagement)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {showAdvancedPieceManagement ? 'Hide' : 'Show'} Advanced Options
          </button>
          
          <button
            onClick={calculateAll}
            className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
          >
            Calculate with Optimization
          </button>
          
          {allResults.length > 0 && (
            <button
              onClick={generatePDF}
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
            >
              Generate PDF Quote
            </button>
          )}
        </div>

        {/* Project Summary for Advanced Management */}
        {showAdvancedPieceManagement && products.some(p => p.customName || p.priority !== 'normal') && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Project Overview</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Priority Breakdown */}
              <div className="bg-white p-3 rounded border">
                <h4 className="font-medium text-gray-800 mb-2">Priority Distribution</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>High Priority:</span>
                    <span className="font-semibold text-red-600">
                      {products.filter(p => p.priority === 'high').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Normal:</span>
                    <span className="font-semibold">
                      {products.filter(p => p.priority === 'normal' || !p.priority).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Low Priority:</span>
                    <span className="font-semibold text-gray-500">
                      {products.filter(p => p.priority === 'low').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Project Phases */}
              <div className="bg-white p-3 rounded border">
                <h4 className="font-medium text-gray-800 mb-2">Project Phases</h4>
                <div className="space-y-1 text-sm">
                  {['design', 'approved', 'production', 'complete'].map(phase => (
                    <div key={phase} className="flex justify-between">
                      <span className="capitalize">{phase}:</span>
                      <span className="font-semibold">
                        {products.filter(p => p.projectPhase === phase).length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Requirements */}
              <div className="bg-white p-3 rounded border">
                <h4 className="font-medium text-gray-800 mb-2">Special Requirements</h4>
                <div className="space-y-1 text-sm">
                  {products.filter(p => p.specialReq && p.specialReq !== 'none').map((product, idx) => (
                    <div key={idx} className="text-orange-600">
                      {product.customName || `Product ${products.indexOf(product) + 1}`}: {product.specialReq?.replace('-', ' ')}
                    </div>
                  ))}
                  {!products.some(p => p.specialReq && p.specialReq !== 'none') && (
                    <div className="text-gray-500">No special requirements</div>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline View */}
            {products.some(p => p.installDate) && (
              <div className="mt-4 bg-white p-3 rounded border">
                <h4 className="font-medium text-gray-800 mb-2">Installation Timeline</h4>
                <div className="space-y-2">
                  {products
                    .filter(p => p.installDate)
                    .sort((a, b) => new Date(a.installDate) - new Date(b.installDate))
                    .map((product, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span>{product.customName || `Product ${products.indexOf(product) + 1}`}</span>
                        <span className="font-semibold text-blue-600">
                          {new Date(product.installDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mixed Stone Types Summary */}
        {allResults.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Quote Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>Total Products:</strong> {allResults.length}
              </div>
              <div>
                <strong>Stone Types:</strong> {[...new Set(allResults.map(r => r.stone))].length}
              </div>
              <div>
                <strong>Total Pieces:</strong> {allResults.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0)}
              </div>
              <div>
                <strong>Total Quote:</strong> ${allResults.reduce((sum, p) => sum + (p.result?.finalPrice || 0), 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded shadow-md space-y-4 text-left">
          <h2 className="text-lg font-semibold">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={userInfo?.name || ""}
              onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
              className="border px-4 py-2 rounded w-full"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={userInfo?.email || ""}
              onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
              className="border px-4 py-2 rounded w-full"
              required
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={userInfo?.phone || ""}
              onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
              className="border px-4 py-2 rounded w-full"
              required
            />
          </div>
        </div>

        {allResults.length > 0 && (
          <div className="mt-6 w-full overflow-x-auto">
            <h3 className="text-lg font-semibold mb-4">
              Optimized Results 
              <span className="text-sm font-normal text-gray-600 ml-2">
                ({includeKerf ? `Production Mode (${kerfWidth}" kerf)` : 'Theoretical Mode (no kerf)'})
              </span>
            </h3>

            {/* Layout Preview for First Product */}
            {products[0]?.result && (
              <div className="mb-6 bg-white p-4 rounded border">
                <h4 className="font-semibold text-gray-800 mb-3">
                  Layout Preview: {products[0].stone} ({products[0].width}x{products[0].depth})
                </h4>
                
                {/* Multi-Slab Visualization */}
                <MultiSlabVisualization 
                  pieces={Array(parseInt(products[0].quantity)).fill().map((_, i) => ({
                    id: i + 1,
                    width: parseFloat(products[0].width),
                    depth: parseFloat(products[0].depth),
                    name: `${products[0].stone} #${i + 1}`
                  }))}
                  slabWidth={parseFloat(stoneOptions.find(s => s["Stone Type"] === products[0].stone)?.["Slab Width"] || 126)}
                  slabHeight={parseFloat(stoneOptions.find(s => s["Stone Type"] === products[0].stone)?.["Slab Height"] || 63)}
                  maxPiecesPerSlab={products[0].result.topsPerSlab}
                  includeKerf={includeKerf}
                  kerfWidth={kerfWidth}
                />
              </div>
            )}

            {/* Export Controls */}
            <LayoutExportControls 
              allResults={allResults}
              products={products}
              stoneOptions={stoneOptions}
              includeKerf={includeKerf}
              kerfWidth={kerfWidth}
            />

            <table className="min-w-full border-collapse border text-sm">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border px-4 py-2">Product Name</th>
                  <th className="border px-4 py-2">Stone</th>
                  <th className="border px-4 py-2">Size</th>
                  <th className="border px-4 py-2">Qty</th>
                  <th className="border px-4 py-2">Priority</th>
                  <th className="border px-4 py-2">Edge</th>
                  <th className="border px-4 py-2">Area (sqft)</th>
                  <th className="border px-4 py-2">Tops/Slab</th>
                  <th className="border px-4 py-2">Slabs Needed</th>
                  <th className="border px-4 py-2">Efficiency</th>
                  <th className="border px-4 py-2">Final $</th>
                </tr>
              </thead>
              <tbody>
                {allResults.map((p, i) => (
                  <tr key={i} className="text-center">
                    <td className="border px-4 py-2 text-left">
                      <div className="font-medium">
                        {p.customName || `Product ${i + 1}`}
                      </div>
                      {p.specialReq && p.specialReq !== 'none' && (
                        <div className="text-xs text-orange-600">
                          {p.specialReq.replace('-', ' ')}
                        </div>
                      )}
                      {p.installDate && (
                        <div className="text-xs text-blue-600">
                          Install: {new Date(p.installDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="border px-4 py-2">{p.stone}</td>
                    <td className="border px-4 py-2">{p.width}×{p.depth}</td>
                    <td className="border px-4 py-2">{p.quantity}</td>
                    <td className="border px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        p.priority === 'high' ? 'bg-red-100 text-red-800' :
                        p.priority === 'low' ? 'bg-gray-100 text-gray-600' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {p.priority === 'high' ? 'High' : p.priority === 'low' ? 'Low' : 'Normal'}
                      </span>
                    </td>
                    <td className="border px-4 py-2">{p.edgeDetail}</td>
                    <td className="border px-4 py-2">{p.result?.usableAreaSqft.toFixed(2)}</td>
                    <td className="border px-4 py-2 font-semibold text-purple-600">
                      {p.result?.topsPerSlab}
                    </td>
                    <td className="border px-4 py-2 font-semibold text-blue-600">
                      {p.result?.totalSlabsNeeded}
                    </td>
                    <td className="border px-4 py-2">
                      <span className={`font-semibold ${p.result?.efficiency > 80 ? 'text-green-600' : p.result?.efficiency > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {p.result?.efficiency.toFixed(1)}%
                      </span>
                    </td>
                    <td className="border px-4 py-2 font-semibold text-green-600">
                      ${p.result?.finalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan="10" className="border px-4 py-2 text-right">Total:</td>
                  <td className="border px-4 py-2 text-center">
                    ${allResults.reduce((sum, p) => sum + (p.result?.finalPrice || 0), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <h4 className="font-semibold text-blue-800">Total Slabs Needed</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {allResults.reduce((sum, p) => sum + (p.result?.totalSlabsNeeded || 0), 0)}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <h4 className="font-semibold text-green-800">Average Efficiency</h4>
                <p className="text-2xl font-bold text-green-600">
                  {(allResults.reduce((sum, p) => sum + (p.result?.efficiency || 0), 0) / allResults.length).toFixed(1)}%
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <h4 className="font-semibold text-purple-800">Material Savings</h4>
                <p className="text-sm text-purple-600">vs. Standard Calculation</p>
                <p className="text-xl font-bold text-purple-600">Optimized!</p>
              </div>
            </div>

            {/* Stone Type Breakdown */}
            {[...new Set(allResults.map(r => r.stone))].length > 1 && (
              <div className="mt-6 bg-yellow-50 p-4 rounded">
                <h4 className="font-semibold text-yellow-800 mb-3">Multi-Stone Type Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...new Set(allResults.map(r => r.stone))].map(stoneType => {
                    const stoneProducts = allResults.filter(r => r.stone === stoneType);
                    const stoneTotal = stoneProducts.reduce((sum, p) => sum + (p.result?.finalPrice || 0), 0);
                    const stoneSlabs = stoneProducts.reduce((sum, p) => sum + (p.result?.totalSlabsNeeded || 0), 0);
                    
                    return (
                      <div key={stoneType} className="bg-white p-3 rounded border">
                        <h5 className="font-semibold text-gray-800">{stoneType}</h5>
                        <div className="text-sm space-y-1">
                          <div>Products: {stoneProducts.length}</div>
                          <div>Slabs Needed: {stoneSlabs}</div>
                          <div>Subtotal: ${stoneTotal.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {allResults.some(p => p.result?.optimization) && (
              <div className="mt-6 bg-gray-50 p-4 rounded">
                <h4 className="font-semibold text-gray-800 mb-2">Optimization Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Mode:</strong> {includeKerf ? 'Production (with kerf)' : 'Theoretical (no kerf)'}</p>
                    <p><strong>Kerf Width:</strong> {includeKerf ? `${kerfWidth}"` : 'N/A'}</p>
                    <p><strong>Breakage Buffer:</strong> {breakageBuffer}%</p>
                  </div>
                  <div>
                    <p><strong>Algorithm:</strong> Mixed orientation optimization</p>
                    <p><strong>Efficiency Method:</strong> Maximum pieces per slab</p>
                    <p><strong>Waste Minimization:</strong> Advanced layout planning</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoneTopEstimator;import { useState, useEffect } from 'react';

// Helper function to generate layout for a single slab
const generateSlabLayout = (pieces, slabWidth, slabHeight, maxPiecesPerSlab, includeKerf, kerfWidth) => {
  // Use the same logic as SlabLayoutVisualization but return layout data
  const pieceWidth = pieces[0].width;
  const pieceHeight = pieces[0].depth;
  const kerf = includeKerf ? kerfWidth : 0;
  
  // This would use the same algorithm as in SlabLayoutVisualization
  // For now, return a simple layout - this can be enhanced
  return pieces.map((piece, index) => ({
    ...piece,
    position: index + 1,
    slabPosition: { x: 0, y: 0 } // Simplified for now
  }));
};

// Layout Export Component
const LayoutExportControls = ({ allResults, products, stoneOptions, includeKerf, kerfWidth }) => {
  const [exportFormat, setExportFormat] = useState('image');
  const [includeDetails, setIncludeDetails] = useState(true);
  
  const exportLayoutAsImage = () => {
    // Create a new window/canvas for export
    const exportWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!exportWindow) {
      alert('Please allow popups for layout export');
      return;
    }
    
    exportWindow.document.write(`
      <html>
        <head>
          <title>Stone Layout Export - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .slab-container { margin-bottom: 40px; page-break-inside: avoid; }
            .slab-visual { border: 2px solid #333; margin: 20px 0; position: relative; background: #f5f5f5; }
            .piece { position: absolute; border: 2px solid; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; }
            .piece.vertical { background: #e3f2fd; border-color: #1976d2; color: #1976d2; }
            .piece.horizontal { background: #fff3e0; border-color: #f57c00; color: #f57c00; }
            .summary { background: #f9f9f9; padding: 15px; border-radius: 5px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Stone Layout Plan</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Mode: ${includeKerf ? `Production (${kerfWidth}" kerf)` : 'Theoretical (no kerf)'}</p>
          </div>
        </body>
      </html>
    `);
    
    // Add layout content for each product
    allResults.forEach((product, productIndex) => {
      if (!product.result) return;
      
      const stone = stoneOptions.find(s => s["Stone Type"] === product.stone);
      const slabWidth = parseFloat(stone?.["Slab Width"] || 126);
      const slabHeight = parseFloat(stone?.["Slab Height"] || 63);
      
      exportWindow.document.body.innerHTML += `
        <div class="slab-container">
          <h2>Product ${productIndex + 1}: ${product.stone} (${product.width}×${product.depth})</h2>
          <div class="summary">
            <strong>Quantity:</strong> ${product.quantity} pieces | 
            <strong>Slabs Needed:</strong> ${product.result.totalSlabsNeeded} | 
            <strong>Efficiency:</strong> ${product.result.efficiency.toFixed(1)}%
          </div>
        </div>
      `;
    });
    
    exportWindow.document.body.innerHTML += `
      <div class="no-print" style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Layout</button>
        <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
      </div>
    `;
    
    exportWindow.document.close();
  };
  
  const generateCutList = () => {
    let cutListContent = `STONE CUT LIST - ${new Date().toLocaleDateString()}\n`;
    cutListContent += `Mode: ${includeKerf ? `Production (${kerfWidth}" kerf)` : 'Theoretical (no kerf)'}\n`;
    cutListContent += `=`.repeat(60) + '\n\n';
    
    allResults.forEach((product, productIndex) => {
      if (!product.result) return;
      
      cutListContent += `PRODUCT ${productIndex + 1}: ${product.stone}\n`;
      cutListContent += `Size: ${product.width}" × ${product.depth}"\n`;
      cutListContent += `Quantity: ${product.quantity} pieces\n`;
      cutListContent += `Slabs Required: ${product.result.totalSlabsNeeded}\n`;
      cutListContent += `Pieces per Slab: ${product.result.topsPerSlab}\n`;
      cutListContent += `Efficiency: ${product.result.efficiency.toFixed(1)}%\n`;
      
      // Generate piece list
      for (let i = 1; i <= product.quantity; i++) {
        const slabNumber = Math.ceil(i / product.result.topsPerSlab);
        const pieceOnSlab = ((i - 1) % product.result.topsPerSlab) + 1;
        cutListContent += `  Piece ${i}: Slab ${slabNumber}, Position ${pieceOnSlab}\n`;
      }
      
      cutListContent += '\n' + '-'.repeat(40) + '\n\n';
    });
    
    // Create downloadable file
    const blob = new Blob([cutListContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stone_cut_list_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const shareLayoutURL = () => {
    // Create a shareable URL with layout data
    const layoutData = {
      products: products.filter(p => p.result),
      settings: { includeKerf, kerfWidth },
      timestamp: new Date().toISOString()
    };
    
    // In a real app, this would be stored in a database and return a short URL
    const encodedData = btoa(JSON.stringify(layoutData));
    const shareURL = `${window.location.origin}${window.location.pathname}?layout=${encodedData}`;
    
    navigator.clipboard.writeText(shareURL).then(() => {
      alert('Layout URL copied to clipboard! Share this with your fabricator.');
    }).catch(() => {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareURL;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Layout URL copied to clipboard! Share this with your fabricator.');
    });
  };
  
  if (!allResults || allResults.length === 0) return null;
  
  return (
    <div className="bg-blue-50 p-4 rounded-lg space-y-4">
      <h4 className="font-semibold text-blue-800">Export & Share Layout</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={exportLayoutAsImage}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <span>📊</span>
          <span>Export Visual Layout</span>
        </button>
        
        <button
          onClick={generateCutList}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700"
        >
          <span>📋</span>
          <span>Download Cut List</span>
        </button>
        
        <button
          onClick={shareLayoutURL}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          <span>🔗</span>
          <span>Share Layout URL</span>
        </button>
      </div>
      
      <div className="text-xs text-gray-600">
        <strong>Export Options:</strong> Visual layouts can be printed or saved as PDF. Cut lists include piece positioning. Share URLs allow fabricators to view your exact layout.
      </div>
    </div>
  );
};

// Slab Layout Visualization Component
const SlabLayoutVisualization = ({ pieces, slabWidth, slabHeight, maxPiecesPerSlab, includeKerf, kerfWidth }) => {
  if (!pieces || pieces.length === 0) return null;

  const pieceWidth = pieces[0].width;
  const pieceHeight = pieces[0].depth;
  const kerf = includeKerf ? kerfWidth : 0;

  // Calculate the optimal layout using general algorithm
  const generateOptimalLayout = () => {
    const layout = [];
    const targetPieces = Math.min(pieces.length, maxPiecesPerSlab);
    
    // If maxPiecesPerSlab was calculated correctly by the mixed orientation algorithm,
    // we need to figure out which combination of orientations achieves that maximum
    
    // First, check if single orientations can achieve the target
    const orientation1Fits = Math.floor((slabWidth + kerf) / (pieceWidth + kerf)) * Math.floor((slabHeight + kerf) / (pieceHeight + kerf));
    const orientation2Fits = Math.floor((slabWidth + kerf) / (pieceHeight + kerf)) * Math.floor((slabHeight + kerf) / (pieceWidth + kerf));
    
    if (orientation1Fits >= targetPieces) {
      // Use vertical orientation (w×h)
      const cols = Math.floor((slabWidth + kerf) / (pieceWidth + kerf));
      const rows = Math.ceil(targetPieces / cols);
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols && layout.length < targetPieces; col++) {
          layout.push({
            x: col * (pieceWidth + kerf),
            y: row * (pieceHeight + kerf),
            width: pieceWidth,
            height: pieceHeight,
            orientation: 'vertical',
            id: layout.length + 1
          });
        }
      }
    } else if (orientation2Fits >= targetPieces) {
      // Use horizontal orientation (h×w)
      const cols = Math.floor((slabWidth + kerf) / (pieceHeight + kerf));
      const rows = Math.ceil(targetPieces / cols);
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols && layout.length < targetPieces; col++) {
          layout.push({
            x: col * (pieceHeight + kerf),
            y: row * (pieceWidth + kerf),
            width: pieceHeight,
            height: pieceWidth,
            orientation: 'horizontal',
            id: layout.length + 1
          });
        }
      }
    } else {
      // Mixed orientation needed - find the optimal combination that gives us targetPieces
      // This should match the calculation logic in calculateMaxPiecesPerSlab
      
      let bestLayout = [];
      let maxFound = 0;
      
      // Try Method A: rows of orientation 1, then rows of orientation 2
      for (let rows1 = 0; rows1 <= Math.floor((slabHeight + kerf) / (pieceHeight + kerf)); rows1++) {
        const usedHeight1 = Math.max(0, rows1 * (pieceHeight + kerf) - kerf);
        const remainingHeight = slabHeight - usedHeight1;
        
        const pieces1 = rows1 * Math.floor((slabWidth + kerf) / (pieceWidth + kerf));
        
        let pieces2 = 0;
        if (remainingHeight >= pieceWidth) {
          const rows2 = Math.floor((remainingHeight + kerf) / (pieceWidth + kerf));
          pieces2 = rows2 * Math.floor((slabWidth + kerf) / (pieceHeight + kerf));
        }
        
        const totalPieces = pieces1 + pieces2;
        
        // Accept any layout that can fit our targetPieces, prioritizing layouts that use exactly targetPieces
        if (totalPieces >= targetPieces && (totalPieces <= maxFound + 1 || bestLayout.length === 0)) {
          // Generate this layout
          const tempLayout = [];
          
          // Add orientation 1 pieces (vertical) - but only up to what we need
          const cols1 = Math.floor((slabWidth + kerf) / (pieceWidth + kerf));
          let piecesAdded = 0;
          for (let row = 0; row < rows1 && piecesAdded < targetPieces; row++) {
            for (let col = 0; col < cols1 && piecesAdded < targetPieces; col++) {
              tempLayout.push({
                x: col * (pieceWidth + kerf),
                y: row * (pieceHeight + kerf),
                width: pieceWidth,
                height: pieceHeight,
                orientation: 'vertical',
                id: tempLayout.length + 1
              });
              piecesAdded++;
            }
          }
          
          // Add orientation 2 pieces (horizontal) - only if we still need more pieces
          if (piecesAdded < targetPieces && remainingHeight >= pieceWidth) {
            const rows2 = Math.floor((remainingHeight + kerf) / (pieceWidth + kerf));
            const cols2 = Math.floor((slabWidth + kerf) / (pieceHeight + kerf));
            for (let row = 0; row < rows2 && piecesAdded < targetPieces; row++) {
              for (let col = 0; col < cols2 && piecesAdded < targetPieces; col++) {
                tempLayout.push({
                  x: col * (pieceHeight + kerf),
                  y: usedHeight1 + row * (pieceWidth + kerf),
                  width: pieceHeight,
                  height: pieceWidth,
                  orientation: 'horizontal',
                  id: tempLayout.length + 1
                });
                piecesAdded++;
              }
            }
          }
          
          // Use this layout if it fits our pieces better
          if (tempLayout.length >= targetPieces || tempLayout.length > bestLayout.length) {
            bestLayout = tempLayout.slice(0, targetPieces);
            maxFound = tempLayout.length;
          }
        }
      }
      
      // Try Method B: rows of orientation 2, then rows of orientation 1
      for (let rows2 = 0; rows2 <= Math.floor((slabHeight + kerf) / (pieceWidth + kerf)); rows2++) {
        const usedHeight2 = Math.max(0, rows2 * (pieceWidth + kerf) - kerf);
        const remainingHeight = slabHeight - usedHeight2;
        
        const pieces2 = rows2 * Math.floor((slabWidth + kerf) / (pieceHeight + kerf));
        
        let pieces1 = 0;
        if (remainingHeight >= pieceHeight) {
          const rows1 = Math.floor((remainingHeight + kerf) / (pieceHeight + kerf));
          pieces1 = rows1 * Math.floor((slabWidth + kerf) / (pieceWidth + kerf));
        }
        
        const totalPieces = pieces1 + pieces2;
        
        // Accept any layout that can fit our targetPieces
        if (totalPieces >= targetPieces && (totalPieces < maxFound || bestLayout.length < targetPieces)) {
          // Generate this layout
          const tempLayout = [];
          
          // Add orientation 2 pieces (horizontal) - but only up to what we need
          const cols2 = Math.floor((slabWidth + kerf) / (pieceHeight + kerf));
          let piecesAdded = 0;
          for (let row = 0; row < rows2 && piecesAdded < targetPieces; row++) {
            for (let col = 0; col < cols2 && piecesAdded < targetPieces; col++) {
              tempLayout.push({
                x: col * (pieceHeight + kerf),
                y: row * (pieceWidth + kerf),
                width: pieceHeight,
                height: pieceWidth,
                orientation: 'horizontal',
                id: tempLayout.length + 1
              });
              piecesAdded++;
            }
          }
          
          // Add orientation 1 pieces (vertical) - only if we still need more pieces
          if (piecesAdded < targetPieces && remainingHeight >= pieceHeight) {
            const rows1 = Math.floor((remainingHeight + kerf) / (pieceHeight + kerf));
            const cols1 = Math.floor((slabWidth + kerf) / (pieceWidth + kerf));
            for (let row = 0; row < rows1 && piecesAdded < targetPieces; row++) {
              for (let col = 0; col < cols1 && piecesAdded < targetPieces; col++) {
                tempLayout.push({
                  x: col * (pieceWidth + kerf),
                  y: usedHeight2 + row * (pieceHeight + kerf),
                  width: pieceWidth,
                  height: pieceHeight,
                  orientation: 'vertical',
                  id: tempLayout.length + 1
                });
                piecesAdded++;
              }
            }
          }
          
          // Use this layout if it's better (fits more pieces or fits exactly)
          if (tempLayout.length >= targetPieces && (tempLayout.length < maxFound || bestLayout.length < targetPieces)) {
            bestLayout = tempLayout.slice(0, targetPieces);
            maxFound = tempLayout.length;
          }
        }
      }
      
      layout.push(...bestLayout);
    }
    
    console.log(`Generated layout for ${pieceWidth}×${pieceHeight} on ${slabWidth}×${slabHeight}`);
    console.log(`Target pieces: ${targetPieces}, Generated pieces: ${layout.length}`);
    console.log(`Max capacity: ${maxPiecesPerSlab}`);
    console.log('Layout pieces:', layout);
    
    return layout;
  };

  const layoutPieces = generateOptimalLayout();
  
  // Calculate scale to fit the visualization
  const containerWidth = 400;
  const containerHeight = 250;
  const scaleX = containerWidth / slabWidth;
  const scaleY = containerHeight / slabHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9; // 90% of available space

  const scaledSlabWidth = slabWidth * scale;
  const scaledSlabHeight = slabHeight * scale;

  return (
    <div className="relative">
      {/* Slab dimensions - positioned outside the layout */}
      <div className="mb-2 text-sm text-gray-600 text-center">
        Slab: {slabWidth}" × {slabHeight}"
      </div>
      
      <div className="relative border-2 border-gray-800 bg-gray-100" 
           style={{ 
             width: `${scaledSlabWidth}px`, 
             height: `${scaledSlabHeight}px`,
             margin: '0 auto'
           }}>
        
        {/* Render pieces */}
        {layoutPieces.map((piece) => (
          <div
            key={piece.id}
            className={`absolute border-2 flex items-center justify-center text-xs font-semibold ${
              piece.orientation === 'vertical' 
                ? 'bg-blue-200 border-blue-600 text-blue-800' 
                : 'bg-orange-200 border-orange-600 text-orange-800'
            }`}
            style={{
              left: `${piece.x * scale}px`,
              top: `${piece.y * scale}px`,
              width: `${piece.width * scale}px`,
              height: `${piece.height * scale}px`,
            }}
          >
            <div className="text-center">
              <div>{piece.id}</div>
              <div className="text-xs">{piece.width}×{piece.height}</div>
            </div>
          </div>
        ))}
        
        {/* Show kerf lines if enabled */}
        {includeKerf && kerf > 0 && layoutPieces.length > 1 && (
          <>
            {/* Vertical kerf lines */}
            {Array.from(new Set(layoutPieces.map(p => p.x + p.width))).map((x, i) => (
              <div
                key={`v-kerf-${i}`}
                className="absolute bg-red-300 opacity-70"
                style={{
                  left: `${x * scale}px`,
                  top: '0px',
                  width: `${kerf * scale}px`,
                  height: `${scaledSlabHeight}px`,
                }}
              />
            ))}
            {/* Horizontal kerf lines */}
            {Array.from(new Set(layoutPieces.map(p => p.y + p.height))).map((y, i) => (
              <div
                key={`h-kerf-${i}`}
                className="absolute bg-red-300 opacity-70"
                style={{
                  left: '0px',
                  top: `${y * scale}px`,
                  width: `${scaledSlabWidth}px`,
                  height: `${kerf * scale}px`,
                }}
              />
            ))}
          </>
        )}
      </div>
      
      {/* Layout info below */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        Showing {layoutPieces.length} of {pieces.length} pieces (max {maxPiecesPerSlab}/slab)
      </div>
    </div>
  );
};

// Multi-Slab Layout Visualization Component
const MultiSlabVisualization = ({ pieces, slabWidth, slabHeight, maxPiecesPerSlab, includeKerf, kerfWidth }) => {
  if (!pieces || pieces.length === 0) return null;

  const pieceWidth = pieces[0].width;
  const pieceHeight = pieces[0].depth;
  
  // Group pieces into slabs
  const slabs = [];
  let remainingPieces = [...pieces];
  let slabNumber = 1;
  
  while (remainingPieces.length > 0) {
    const piecesForThisSlab = remainingPieces.splice(0, Math.min(maxPiecesPerSlab, remainingPieces.length));
    const slabLayout = generateSlabLayout(piecesForThisSlab, slabWidth, slabHeight, maxPiecesPerSlab, includeKerf, kerfWidth);
    slabs.push({
      number: slabNumber++,
      pieces: piecesForThisSlab,
      layout: slabLayout,
      utilization: (piecesForThisSlab.length / maxPiecesPerSlab * 100).toFixed(1)
    });
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h4 className="text-lg font-semibold mb-2">Multi-Slab Layout Plan</h4>
        <p className="text-sm text-gray-600">
          {pieces.length} pieces across {slabs.length} slab{slabs.length > 1 ? 's' : ''}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {slabs.map((slab) => (
          <div key={slab.number} className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-center mb-3">
              <h5 className="font-semibold text-gray-800">
                Slab #{slab.number}
              </h5>
              <div className="text-sm space-y-1">
                <div>Pieces: {slab.pieces.length}/{maxPiecesPerSlab}</div>
                <div className="text-xs text-gray-600">
                  Utilization: {slab.utilization}%
                </div>
              </div>
            </div>
            
            <SlabLayoutVisualization 
              pieces={slab.pieces}
              slabWidth={slabWidth}
              slabHeight={slabHeight}
              maxPiecesPerSlab={maxPiecesPerSlab}
              includeKerf={includeKerf}
              kerfWidth={kerfWidth}
            />
            
            {/* Piece List for this slab */}
            <div className="mt-3 text-xs">
              <strong>Pieces on this slab:</strong>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {slab.pieces.map((piece, idx) => (
                  <div key={idx} className="text-gray-600">
                    #{piece.id}: {pieceWidth}×{pieceHeight}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary Statistics */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h5 className="font-semibold mb-2">Layout Summary</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium">Total Slabs</div>
            <div className="text-lg font-bold text-blue-600">{slabs.length}</div>
          </div>
          <div>
            <div className="font-medium">Total Pieces</div>
            <div className="text-lg font-bold text-green-600">{pieces.length}</div>
          </div>
          <div>
            <div className="font-medium">Avg Utilization</div>
            <div className="text-lg font-bold text-purple-600">
              {(slabs.reduce((sum, s) => sum + parseFloat(s.utilization), 0) / slabs.length).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="font-medium">Waste Factor</div>
            <div className="text-lg font-bold text-orange-600">
              {((slabs.length * maxPiecesPerSlab - pieces.length) / (slabs.length * maxPiecesPerSlab) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Stone Top Estimator Component
const StoneTopEstimator = () => {
  const [stoneOptions, setStoneOptions] = useState([]);
  const [file, setFile] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const correctPassword = 'stone123';

  // New settings
  const [includeKerf, setIncludeKerf] = useState(true);
  const [kerfWidth, setKerfWidth] = useState(0.125);
  const [breakageBuffer, setBreakageBuffer] = useState(10);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const [userInfo, setUserInfo] = useState({ name: "", email: "", phone: "" });
  const [products, setProducts] = useState([
    { stone: '', width: '', depth: '', quantity: 1, edgeDetail: 'Eased', result: null, id: Date.now(), customName: '', priority: 'normal' }
  ]);
  const [allResults, setAllResults] = useState([]);
  const [showAdvancedPieceManagement, setShowAdvancedPieceManagement] = useState(false);

  useEffect(() => {
    // Load html2pdf from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    document.head.appendChild(script);

    // Fetch stone data from Google Sheets API
    fetch("https://opensheet.elk.sh/1g8w934dZH-NEuKfK8wg_RZYiXyLSSf87H0Xwec6KAAc/Sheet1")
      .then((res) => res.json())
      .then((data) => {
        setStoneOptions(data);
        setProducts((prev) =>
          prev.map((p) => ({ ...p, stone: data[0]?.["Stone Type"] || '' }))
        );
      })
      .catch((error) => {
        console.error("Failed to load stone data:", error);
        alert("Failed to load stone data from Google Sheets. Please check your internet connection and try again.");
        setStoneOptions([]);
      });
  }, []);

  // Calculate maximum pieces that can fit per slab with optimal mixed orientations
  const calculateMaxPiecesPerSlab = (pieceW, pieceH, slabW, slabH) => {
    const kerf = includeKerf ? kerfWidth : 0;
    let maxPieces = 0;

    // Option 1: All pieces in orientation 1 (w × h)
    const fit1W = Math.floor((slabW + kerf) / (pieceW + kerf));
    const fit1H = Math.floor((slabH + kerf) / (pieceH + kerf));
    const option1 = fit1W * fit1H;

    // Option 2: All pieces in orientation 2 (h × w)  
    const fit2W = Math.floor((slabW + kerf) / (pieceH + kerf));
    const fit2H = Math.floor((slabH + kerf) / (pieceW + kerf));
    const option2 = fit2W * fit2H;

    maxPieces = Math.max(option1, option2);

    // Option 3: Mixed orientations - CORRECTED ALGORITHM
    // Try all possible row combinations like the CutList Optimizer
    
    // Method A: First row(s) with orientation 1, remaining rows with orientation 2
    for (let rows1 = 0; rows1 <= Math.floor((slabH + kerf) / (pieceH + kerf)); rows1++) {
      const usedHeight1 = Math.max(0, rows1 * (pieceH + kerf) - kerf);
      const remainingHeight = slabH - usedHeight1;
      
      const pieces1 = rows1 * Math.floor((slabW + kerf) / (pieceW + kerf));
      
      if (remainingHeight >= pieceW) {
        const rows2 = Math.floor((remainingHeight + kerf) / (pieceW + kerf));
        const pieces2 = rows2 * Math.floor((slabW + kerf) / (pieceH + kerf));
        maxPieces = Math.max(maxPieces, pieces1 + pieces2);
      } else {
        maxPieces = Math.max(maxPieces, pieces1);
      }
    }

    // Method B: First row(s) with orientation 2, remaining rows with orientation 1
    for (let rows2 = 0; rows2 <= Math.floor((slabH + kerf) / (pieceW + kerf)); rows2++) {
      const usedHeight2 = Math.max(0, rows2 * (pieceW + kerf) - kerf);
      const remainingHeight = slabH - usedHeight2;
      
      const pieces2 = rows2 * Math.floor((slabW + kerf) / (pieceH + kerf));
      
      if (remainingHeight >= pieceH) {
        const rows1 = Math.floor((remainingHeight + kerf) / (pieceH + kerf));
        const pieces1 = rows1 * Math.floor((slabW + kerf) / (pieceW + kerf));
        maxPieces = Math.max(maxPieces, pieces1 + pieces2);
      } else {
        maxPieces = Math.max(maxPieces, pieces2);
      }
    }

    return maxPieces;
  };

  // Enhanced slab optimization with layout generation
  const optimizeSlabLayout = (pieces, slabWidth, slabHeight) => {
    if (pieces.length === 0) return { slabs: [], unplacedPieces: [], totalSlabsNeeded: 0, efficiency: 0, topsPerSlab: 0 };

    const pieceWidth = pieces[0].width;
    const pieceHeight = pieces[0].depth;
    const maxPiecesPerSlab = calculateMaxPiecesPerSlab(pieceWidth, pieceHeight, slabWidth, slabHeight);
    
    const slabs = [];
    let remainingPieces = [...pieces];

    while (remainingPieces.length > 0) {
      const piecesForThisSlab = remainingPieces.splice(0, Math.min(maxPiecesPerSlab, remainingPieces.length));
      const slabLayout = createDetailedSlabLayout(piecesForThisSlab, slabWidth, slabHeight, maxPiecesPerSlab);
      slabs.push(slabLayout);
    }

    return {
      slabs,
      unplacedPieces: [],
      totalSlabsNeeded: slabs.length,
      efficiency: calculateEfficiency(slabs, slabWidth, slabHeight),
      topsPerSlab: maxPiecesPerSlab
    };
  };

  // Create detailed slab layout with piece positions
  const createDetailedSlabLayout = (pieces, slabW, slabH, maxPieces) => {
    const positionedPieces = pieces.map((piece, index) => ({
      ...piece,
      position: index + 1
    }));

    return {
      pieces: positionedPieces,
      usedArea: pieces.reduce((sum, p) => sum + p.width * p.depth, 0),
      maxCapacity: maxPieces,
      availableSpaces: []
    };
  };

  const calculateEfficiency = (slabs, slabWidth, slabHeight) => {
    const totalSlabArea = slabs.length * slabWidth * slabHeight;
    const totalUsedArea = slabs.reduce((sum, slab) => sum + slab.usedArea, 0);
    return totalSlabArea > 0 ? (totalUsedArea / totalSlabArea) * 100 : 0;
  };

  const handleDrawingUpload = async (e, index) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setLoadingAI(true);
    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const res = await fetch("https://gpt4-drawing-backend.vercel.app/api/extract-dimensions", {
        method: "POST",
        headers: {
          "x-vercel-protection-bypass": "paramusicalkariokparamusicalkari"
        },
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        const updated = [...products];
        updated[index].width = json.data.width;
        updated[index].depth = json.data.depth;
        setProducts(updated);
        alert("Dimensions extracted successfully!");
      } else {
        alert("AI Error: " + (json.error || "Unexpected response"));
      }
    } catch (error) {
      console.error("AI extraction error:", error);
      alert("Failed to extract dimensions from drawing.");
    } finally {
      setLoadingAI(false);
    }
  };

  const updateProduct = (index, field, value) => {
    const updated = [...products];
    updated[index][field] = value;
    setProducts(updated);
  };

  const addProduct = () => {
    setProducts([
      ...products,
      { stone: stoneOptions[0]?.["Stone Type"] || '', width: '', depth: '', quantity: 1, edgeDetail: 'Eased', result: null, id: Date.now(), customName: '', priority: 'normal' }
    ]);
  };

  const removeProduct = (index) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const calculateAll = () => {
    console.log("Calculate button clicked!");
    
    const results = products.map((product) => {
      const stone = stoneOptions.find(s => s["Stone Type"] === product.stone);
      if (!stone) return { ...product, result: null };

      const slabCost = parseFloat(stone["Slab Cost"]);
      const fabCost = parseFloat(stone["Fab Cost"]);
      const markup = parseFloat(stone["Mark Up"]);
      const w = parseFloat(product.width);
      const d = parseFloat(product.depth);
      const quantity = parseInt(product.quantity);

      if (!w || !d || isNaN(slabCost) || isNaN(fabCost) || isNaN(markup)) return { ...product, result: null };

      const slabWidth = parseFloat(stone["Slab Width"]);
      const slabHeight = parseFloat(stone["Slab Height"]);

      const pieces = Array(quantity).fill().map((_, i) => ({
        id: i + 1,
        width: w,
        depth: d,
        name: `${product.stone} #${i + 1}`
      }));

      const optimization = optimizeSlabLayout(pieces, slabWidth, slabHeight);
      
      const area = w * d;
      const usableAreaSqft = (area / 144) * quantity;
      const totalSlabsNeeded = optimization.totalSlabsNeeded;
      const efficiency = optimization.efficiency;
      
      const materialCost = (slabCost * totalSlabsNeeded) * (1 + breakageBuffer/100);
      const fabricationCost = usableAreaSqft * fabCost;
      const rawCost = materialCost + fabricationCost;
      const finalPrice = rawCost * markup;

      return {
        ...product,
        result: {
          usableAreaSqft,
          totalSlabsNeeded,
          efficiency,
          materialCost,
          fabricationCost,
          rawCost,
          finalPrice,
          optimization,
          topsPerSlab: optimization.topsPerSlab
        }
      };
    });

    // Update products with results for layout preview
    const updatedProducts = products.map((product, index) => ({
      ...product,
      result: results[index]?.result || null
    }));
    setProducts(updatedProducts);
    setAllResults(results);

    const sheetRows = results.map(p => {
      if (!p.result) return null;
      
      return {
        "Timestamp": "Now",
        "Name": userInfo.name || "",
        "Email": userInfo.email || "",
        "Phone": userInfo.phone || "",
        "Stone": p.stone || "",
        "Note": p.note || "",
        "Size": `${p.width}x${p.depth}`,
        "Qty": p.quantity || 0,
        "Edge": p.edgeDetail || "",
        "Area": ((parseFloat(p.width || 0) * parseFloat(p.depth || 0)) / 144 * parseInt(p.quantity || 0)).toFixed(2),
        "Tops/Slab": p.result?.topsPerSlab || 0,
        "Slabs Needed": p.result?.totalSlabsNeeded || Math.ceil(parseInt(p.quantity || 0) / (p.result?.topsPerSlab || 1)),
        "Efficiency": p.result?.efficiency ? p.result.efficiency.toFixed(1) + "%" : "N/A",
        "Breakage Buffer": breakageBuffer + "%",
        "Kerf Included": includeKerf ? "Yes (" + kerfWidth + "\")" : "No",
        "Material": parseFloat(p.result?.materialCost || 0).toFixed(2),
        "Fab": parseFloat(p.result?.fabricationCost || 0).toFixed(2),
        "Raw": parseFloat(p.result?.rawCost || 0).toFixed(2),
        "Final": parseFloat(p.result?.finalPrice || 0).toFixed(2)
      };
    }).filter(Boolean);

    console.log("Sending optimized data to SheetDB:", sheetRows);

    fetch("https://sheetdb.io/api/v1/meao888u7pgqn", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ data: sheetRows })
    })
    .then(response => {
      console.log("SheetDB response status:", response.status);
      const responseStatus = response.status;
      return response.text().then(data => {
        console.log("SheetDB raw response:", data);
        try {
          const jsonData = JSON.parse(data);
          console.log("SheetDB parsed response:", jsonData);
          
          if (jsonData.created || responseStatus === 201 || responseStatus === 200) {
            alert("Quote calculated with optimization and saved successfully!");
          } else {
            console.error("SheetDB API error:", jsonData);
            alert("Error saving to sheet: " + (jsonData.error || "Unknown error"));
          }
        } catch (e) {
          console.log("Response is not JSON, raw response:", data);
          if (data.includes("success") || responseStatus === 201 || responseStatus === 200) {
            alert("Quote calculated with optimization and saved successfully!");
          } else {
            console.error("SheetDB parse error:", e);
            alert("Failed to save data to sheet. Check console for details.");
          }
        }
      });
    })
    .catch(error => {
      console.error("Lead capture failed:", error);
      alert("Failed to save quote data. Please try again.");
    });
  };

  const generatePDF = () => {
    if (allResults.length === 0) {
      alert("Please calculate estimates first");
      return;
    }

    if (!window.html2pdf) {
      alert("PDF generator is still loading. Please try again in a moment.");
      return;
    }

    const element = document.createElement('div');
    element.className = 'pdf-content p-6';
    
    element.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="font-size: 24px; font-weight: bold;">AIC SURFACES - OPTIMIZED STONE QUOTE</h1>
        <p>Date: ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 18px; font-weight: bold;">Customer Information</h2>
        <p>Name: ${userInfo.name}</p>
        <p>Email: ${userInfo.email}</p>
        <p>Phone: ${userInfo.phone}</p>
      </div>
      
      <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">Optimized Quote Details</h2>
    `;
    
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    table.innerHTML = `
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Stone</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Size</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Qty</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Edge</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Slabs</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Efficiency</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${allResults.map(p => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${p.stone}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${p.width}×${p.depth}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${p.quantity}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${p.edgeDetail}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${p.result?.totalSlabsNeeded || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${p.result?.efficiency ? p.result.efficiency.toFixed(1) + '%' : 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${p.result?.finalPrice.toFixed(2)}</td>
          </tr>
          ${p.note ? `<tr><td colspan="7" style="border: 1px solid #ddd; padding: 8px; font-style: italic;">Note: ${p.note}</td></tr>` : ''}
        `).join('')}
      </tbody>
    `;
    
    const totalPrice = allResults.reduce((sum, p) => sum + (p.result?.finalPrice || 0), 0);
    const totalSlabs = allResults.reduce((sum, p) => sum + (p.result?.totalSlabsNeeded || 0), 0);
    const avgEfficiency = allResults.reduce((sum, p) => sum + (p.result?.efficiency || 0), 0) / allResults.length;
    
    table.innerHTML += `
      <tfoot>
        <tr style="font-weight: bold;">
          <td colspan="6" style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total:</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${totalPrice.toFixed(2)}</td>
        </tr>
      </tfoot>
    `;
    
    element.appendChild(table);
    
    element.innerHTML += `
      <div style="margin-top: 20px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
        <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">Optimization Summary</h3>
        <p><strong>Total Slabs Required:</strong> ${totalSlabs}</p>
        <p><strong>Average Material Efficiency:</strong> ${avgEfficiency.toFixed(1)}%</p>
        <p><strong>Optimization Method:</strong> Advanced Slab Layout Algorithm</p>
      </div>
    `;
    
    element.innerHTML += `
      <div style="margin-top: 30px;">
        <p style="font-size: 12px;">This optimized quote is valid for 30 days. Calculations include advanced slab optimization for maximum material efficiency. For questions, please contact AIC Surfaces.</p>
      </div>
    `;
    
    const opt = {
      margin: 10,
      filename: `AIC_Optimized_Quote_${userInfo.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    window.html2pdf().from(element).set(opt).save();
  };
