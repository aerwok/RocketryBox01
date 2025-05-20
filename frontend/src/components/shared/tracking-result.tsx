import { motion } from "framer-motion"
import { TrackingInfo } from "./track-order-form"

interface TrackingResultProps {
    data: TrackingInfo;
    className?: string;
}

const TrackingResult = ({ data, className = "" }: TrackingResultProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.5 }}
            className={`bg-white rounded-lg shadow-md p-4 mt-4 overflow-hidden ${className}`}
        >
            <div className="border-b pb-3 mb-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Shipment #{data.awbNumber}</h3>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        {data.currentStatus}
                    </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                        <span className="text-gray-500">Expected Delivery:</span> {data.expectedDelivery}
                    </div>
                    <div>
                        <span className="text-gray-500">Courier:</span> {data.courier}
                    </div>
                    <div>
                        <span className="text-gray-500">From:</span> {data.origin}
                    </div>
                    <div>
                        <span className="text-gray-500">To:</span> {data.destination}
                    </div>
                </div>
            </div>
            
            <h4 className="font-medium mb-3">Tracking History</h4>
            <div className="space-y-4">
                {data.events.map((event, index) => (
                    <div key={index} className="relative pl-6">
                        {index !== data.events.length - 1 && (
                            <div className="absolute top-6 left-[11px] w-0.5 h-full -mt-4 bg-gray-200"></div>
                        )}
                        <div className="absolute top-2 left-0 size-[22px] rounded-full border-2 border-blue-500 bg-white flex items-center justify-center">
                            <div className="size-2 rounded-full bg-blue-500"></div>
                        </div>
                        <div>
                            <div className="flex flex-col sm:flex-row sm:justify-between">
                                <p className="font-medium">{event.status}</p>
                                <p className="text-sm text-gray-500">{event.timestamp}</p>
                            </div>
                            <p className="text-sm">{event.location}</p>
                            {event.description && (
                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default TrackingResult; 