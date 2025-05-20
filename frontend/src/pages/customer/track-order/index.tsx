import { useState } from "react"
import { motion } from "framer-motion"
import { AlertCircle } from "lucide-react"

import CustomerLayout from "@/layouts/customer-layout"
import TrackOrderForm, { TrackingInfo } from "@/components/shared/track-order-form"
import TrackingResult from "@/components/shared/tracking-result"

const CustomerTrackOrderPage = () => {
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null)
  const [error, setError] = useState<string>("")

  const handleTrackingResult = (data: TrackingInfo) => {
    setError("")
    setTrackingInfo(data)
  }

  return (
    <CustomerLayout>
      <div className="container max-w-6xl">
        <div className="mb-6">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-semibold"
          >
            Track Your Order
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500"
          >
            Enter your AWB number to track your shipment status
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <TrackOrderForm
              onTrackingResult={handleTrackingResult}
              className="bg-white border shadow-sm"
            />
          </div>

          <div className="lg:col-span-2">
            {error && (
              <div className="p-4 mb-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" />
                <div className="text-red-700">{error}</div>
              </div>
            )}

            {trackingInfo ? (
              <TrackingResult 
                data={trackingInfo} 
                className="border shadow-sm" 
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-lg p-6 border shadow-sm"
              >
                <h3 className="text-lg font-medium mb-4">Recent Orders</h3>
                
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: item * 0.1 }}
                      className="p-3 bg-gray-50 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">Order #{1000 + item}</span>
                        <span className="text-sm text-blue-600">Track</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Shipped on {new Date(Date.now() - item * 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}

export default CustomerTrackOrderPage 