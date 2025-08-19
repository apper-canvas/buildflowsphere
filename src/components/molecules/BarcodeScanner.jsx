import { useState, useEffect, useRef } from "react"
import Button from "@/components/atoms/Button"
import Card from "@/components/atoms/Card"
import ApperIcon from "@/components/ApperIcon"
import { toast } from "react-toastify"
import { cn } from "@/utils/cn"

const BarcodeScanner = ({ 
  onScan, 
  onClose, 
  className, 
  title = "Scan Barcode/QR Code",
  placeholder = "Position barcode within the frame" 
}) => {
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState(null)
  const [stream, setStream] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const scanIntervalRef = useRef(null)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      setStream(mediaStream)
      setHasPermission(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
        startScanning()
      }
    } catch (error) {
      console.error("Camera access error:", error)
      setHasPermission(false)
      toast.error("Camera access denied. Please enable camera permissions.")
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }
    setIsScanning(false)
  }

  const startScanning = () => {
    setIsScanning(true)
    
    // Simulate barcode detection - in real app, use a barcode detection library
    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && isScanning) {
        captureFrame()
      }
    }, 1000)
  }

  const captureFrame = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (!video || !canvas) return
    
    const context = canvas.getContext('2d')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // In a real implementation, you would use a barcode detection library here
    // For demo purposes, we'll simulate successful scan after 3 seconds
    // This would be replaced with actual barcode/QR detection logic
  }

  const handleManualInput = () => {
    const code = prompt("Enter barcode/product code manually:")
    if (code && code.trim()) {
      handleScanResult(code.trim())
    }
  }

  const handleScanResult = (code) => {
    toast.success(`Scanned: ${code}`)
    onScan?.(code)
    stopCamera()
  }

  const handleClose = () => {
    stopCamera()
    onClose?.()
  }

  if (hasPermission === false) {
    return (
      <Card className={cn("p-6 text-center", className)}>
        <ApperIcon name="CameraOff" size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera Access Required</h3>
        <p className="text-gray-600 mb-4">
          Please enable camera permissions to scan barcodes and QR codes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={startCamera}>
            <ApperIcon name="Camera" size={16} className="mr-2" />
            Enable Camera
          </Button>
          <Button variant="outline" onClick={handleManualInput}>
            <ApperIcon name="Keyboard" size={16} className="mr-2" />
            Manual Input
          </Button>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className={cn("fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4", className)}>
      <Card className="w-full max-w-md">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <ApperIcon name="X" size={20} />
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="relative bg-black rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              autoPlay
              playsInline
              muted
            />
            
            {/* Scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-white border-dashed w-48 h-32 rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <ApperIcon name="Scan" size={32} className="mx-auto mb-2" />
                  <p className="text-sm">{placeholder}</p>
                </div>
              </div>
            </div>
            
            {/* Scanning indicator */}
            {isScanning && (
              <div className="absolute top-4 left-4">
                <div className="flex items-center space-x-2 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">Scanning...</span>
                </div>
              </div>
            )}
          </div>
          
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="flex flex-col gap-3">
            <Button 
              variant="outline" 
              onClick={handleManualInput}
              className="w-full"
            >
              <ApperIcon name="Keyboard" size={16} className="mr-2" />
              Enter Code Manually
            </Button>
            
            {/* Demo scan button - remove in production */}
            <Button 
              onClick={() => handleScanResult("DEMO123456")}
              className="w-full"
            >
              <ApperIcon name="Zap" size={16} className="mr-2" />
              Demo Scan (Remove in Production)
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default BarcodeScanner