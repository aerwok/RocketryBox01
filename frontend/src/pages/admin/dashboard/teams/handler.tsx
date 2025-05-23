import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * This component handles navigation to the team member creation page,
 * ensuring compatibility between local development and Vercel deployment.
 * It's designed to overcome routing issues that can occur in Vercel deployments
 * with client-side routing.
 */
const AdminRegisterHandler = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Wait a moment to ensure navigation works properly
        const timer = setTimeout(() => {
            navigate('/admin/dashboard/teams/create', { replace: true });
        }, 100);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
            <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
            <p className="text-lg text-gray-700">Redirecting to team member registration...</p>
        </div>
    );
};

export default AdminRegisterHandler; 