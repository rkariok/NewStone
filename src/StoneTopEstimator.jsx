{/* Layout Preview for First Product with Results */}
            {products[0]?.result?.optimization && (
              <div className="mt-6 bg-white p-4 rounded border">
                <h4 className="font-semibold text-gray-800 mb-3">
                  Layout Preview: {products[0].stone} ({products[0].width}x{products[0].depth})
                </h4>
                
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Visual Layout */}
                  <div className="flex-1">
                    <SlabLayoutVisualization 
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
                  
                  {/* Layout Analysis */}
                  <div className="w-full lg:w-64 bg-gray-50 p-4 rounded">
                    <h5 className="font-semibold mb-3">Layout Analysis</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-200 border-2 border-blue-600"></div>
                        <span>Vertical: {products[0].width}x{products[0].depth}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-orange-200 border-2 border-orange-600"></div>
                        <span>Horizontal: {products[0].depth}x{products[0].width}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-200 border border-red-400"></div>
                        <span>Kerf: {kerfWidth}"</span>
                      </div>
                      
                      <div className="pt-2 border-t space-y-1">
                        <div><strong>Max Pieces/Slab:</strong> {products[0].result.topsPerSlab}</div>
                        <div><strong>Efficiency:</strong> <span className="text-green-600 font-semibold">{products[0].result.efficiency.toFixed(1)}%</span></div>
                        <div><strong>Slabs Needed:</strong> {products[0].result.totalSlabsNeeded}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
