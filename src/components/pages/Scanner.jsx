import { useState } from "react"
import { useNavigate } from "react-router-dom"
import BarcodeScanner from "@/components/molecules/BarcodeScanner"
import Button from "@/components/atoms/Button"
import Card from "@/components/atoms/Card"
import Badge from "@/components/atoms/Badge"
import ApperIcon from "@/components/ApperIcon"
import { toast } from "react-toastify"
import productService from "@/services/api/productService"

const Scanner = () => {
  const navigate = useNavigate()
  const [showScanner, setShowScanner] = useState(false)
  const [scanHistory, setScanHistory] = useState([])
  const [scanMode, setScanMode] = useState('product') // 'product', 'batch', 'picking'

  const handleScan = async (code) => {
    setShowScanner(false)
    
    const scanRecord = {
      id: Date.now(),
      code,
      timestamp: new Date(),
      mode: scanMode,
      result: null
    }

    try {
      let result = null
      
      if (scanMode === 'product') {
        const products = await productService.search(code)
        result = products?.[0] || null
      } else if (scanMode === 'batch') {
        const batches = await productService.searchBatches(code)
        result = batches?.[0] || null
      }
      
      scanRecord.result = result
      setScanHistory(prev => [scanRecord, ...prev.slice(0, 9)]) // Keep last 10 scans
      
      if (result) {
        toast.success(`${scanMode === 'product' ? 'Product' : 'Batch'} found: ${result.name || result.productName}`)
      } else {
        toast.error(`No ${scanMode} found for code: ${code}`)
      }
    } catch (error) {
      console.error('Scan error:', error)
      toast.error('Error processing scan')
      scanRecord.error = error.message
      setScanHistory(prev => [scanRecord, ...prev.slice(0, 9)])
    }
  }

  const handleViewProduct = (productId) => {
    navigate(`/inventory`)
  }

  const handleViewBatch = (batchId) => {
    navigate(`/batch-management`)
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getScanIcon = (mode) => {
    switch (mode) {
      case 'product': return 'Package'
      case 'batch': return 'Archive'
      case 'picking': return 'Truck'
      default: return 'QrCode'
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Barcode Scanner</h1>
        <p className="text-gray-600">Scan barcodes and QR codes for inventory verification</p>
      </div>

      {/* Scanner Controls */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col space-y-4">
          {/* Scan Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scan Mode
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'product', label: 'Product Lookup', icon: 'Package' },
                { value: 'batch', label: 'Batch Verification', icon: 'Archive' },
                { value: 'picking', label: 'Order Picking', icon: 'Truck' }
              ].map(mode => (
                <Button
                  key={mode.value}
                  variant={scanMode === mode.value ? 'default' : 'outline'}
                  onClick={() => setScanMode(mode.value)}
                  size="sm"
                >
                  <ApperIcon name={mode.icon} size={16} className="mr-2" />
                  {mode.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Start Scanner Button */}
          <Button 
            onClick={() => setShowScanner(true)}
            className="w-full sm:w-auto"
            size="lg"
          >
            <ApperIcon name="Camera" size={20} className="mr-2" />
            Start Scanner
          </Button>
        </div>
      </Card>

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Scans</h3>
          <div className="space-y-3">
            {scanHistory.map((scan) => (
              <div
                key={scan.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${scan.result ? 'bg-green-100' : 'bg-red-100'}`}>
                    <ApperIcon 
                      name={getScanIcon(scan.mode)} 
                      size={16} 
                      className={scan.result ? 'text-green-600' : 'text-red-600'}
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm">{scan.code}</span>
                      <Badge variant={scan.result ? 'success' : 'error'}>
                        {scan.result ? 'Found' : 'Not Found'}
                      </Badge>
                    </div>
                    {scan.result && (
                      <p className="text-sm text-gray-600">
                        {scan.result.name || scan.result.productName}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(scan.timestamp)} • {scan.mode}
                    </p>
                  </div>
                </div>
                
                {scan.result && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => scan.mode === 'product' ? handleViewProduct(scan.result.Id) : handleViewBatch(scan.result.Id)}
                  >
                    <ApperIcon name="Eye" size={14} className="mr-1" />
                    View
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          title={`Scan ${scanMode === 'product' ? 'Product' : scanMode === 'batch' ? 'Batch' : 'Item'} Barcode`}
          placeholder={`Position ${scanMode} barcode in the frame`}
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}

export default Scanner