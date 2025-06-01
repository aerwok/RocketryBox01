import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import { AlertCircle, Package, Clock, MapPin } from "lucide-react"

import CustomerLayout from "@/layouts/customer-layout"
import TrackOrderForm, { TrackingInfo } from "@/components/shared/track-order-form"
import TrackingResult from "@/components/shared/tracking-result"

const CustomerTrackOrderPage = () => {
  const [searchParams] = useSearchParams()
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null)
  const [error, setError] = useState<string>("")
  const [isAutoTracking, setIsAutoTracking] = useState(false)
  const [resetTrigger, setResetTrigger] = useState(0)

  const handleTrackingResult = (data: TrackingInfo) => {
    setError("")
    setTrackingInfo(data)
  }

  const handleTrackingError = (errorMessage: string) => {
    setError(errorMessage)
    setTrackingInfo(null)
  }

  // Auto-track when AWB is provided in URL (only when no tracking info exists)
  useEffect(() => {
    const awbFromUrl = searchParams.get('awb')
    if (awbFromUrl && !isAutoTracking && !trackingInfo && resetTrigger === 0) {
      setIsAutoTracking(true)
    }
  }, [searchParams, isAutoTracking, trackingInfo, resetTrigger])

  const awbFromUrl = searchParams.get('awb')

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header Section */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4"
            >
              <Package className="w-8 h-8" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-gray-900 mb-2"
            >
              Track Your Shipment
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-600 max-w-2xl mx-auto"
            >
              {awbFromUrl ? 
                `Tracking shipment: ${awbFromUrl}` : 
                'Enter your AWB number to get real-time updates on your package delivery status'
              }
            </motion.p>
          </div>

          {/* Main Content */}
          {trackingInfo ? (
            // Full width tracking results when data is available
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <TrackingResult 
                data={trackingInfo} 
                className="bg-white rounded-xl shadow-lg border" 
              />
              
              {/* Track Another Package Button */}
              <div className="text-center mt-8">
                <button
                  onClick={() => {
                    setTrackingInfo(null)
                    setError("")
                    setResetTrigger(prev => prev + 1)
                    window.history.replaceState({}, '', '/customer/track-order')
                  }}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Package className="w-5 h-5 mr-2" />
                  Track Another Package
                </button>
              </div>
            </motion.div>
          ) : (
            // Centered form layout when no data
            <div className="max-w-2xl mx-auto">
              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3"
                >
                  <AlertCircle className="text-red-500 shrink-0 mt-0.5" />
                  <div className="text-red-700">{error}</div>
                </motion.div>
              )}

              {/* Tracking Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TrackOrderForm
                  initialAwb={awbFromUrl || ''}
                  onTrackingResult={handleTrackingResult}
                  onTrackingError={handleTrackingError}
                  className="bg-white rounded-xl shadow-lg border-0"
                  showTitle={false}
                  resetTrigger={resetTrigger}
                />
              </motion.div>

              {/* Features Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full mb-4">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Real-Time Updates</h3>
                  <p className="text-gray-600 text-sm">Get live tracking updates as your package moves through our network</p>
                </div>

                <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-4">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Location Tracking</h3>
                  <p className="text-gray-600 text-sm">See exactly where your package is at every step of the journey</p>
                </div>

                <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-full mb-4">
                    <Package className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Delivery Estimates</h3>
                  <p className="text-gray-600 text-sm">Accurate delivery time predictions based on real logistics data</p>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  )
}

export default CustomerTrackOrderPage 