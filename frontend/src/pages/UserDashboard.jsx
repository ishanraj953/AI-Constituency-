import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getComplaints } from '../services/api';
import ComplaintCard from '../components/ComplaintCard';
import Loader from '../components/Loader';
import { FileText, MapPin, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UserDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getComplaints();
        setComplaints(data.complaints || []);
      } catch (err) {
        setError('Failed to fetch your complaints.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-grow w-full space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-['Outfit']">
            My Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track and manage your submitted grievances.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/user/submit"
            className="inline-flex items-center gap-2 rounded-lg bg-govblue-600 hover:bg-govblue-700 text-white px-4 py-2 text-sm font-semibold shadow-sm transition-all"
          >
            <FileText className="h-4 w-4" />
            New Grievance
          </Link>
          <Link
            to="/user/tracking"
            className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 text-sm font-semibold shadow-sm transition-all"
          >
            <MapPin className="h-4 w-4" />
            Track Status
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <div>
              <p className="text-sm font-bold text-red-800 font-['Outfit']">Error</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 font-['Outfit'] border-b border-slate-200 pb-3">My Recent Complaints</h2>
        
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 flex justify-center items-center">
            <Loader message="Loading your complaints..." />
          </div>
        ) : complaints.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center"
          >
            <div className="mx-auto h-12 w-12 text-slate-300 mb-3">
              <FileText className="h-full w-full" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 font-['Outfit']">No Complaints Yet</h3>
            <p className="text-slate-500 text-xs mt-1">You haven't submitted any grievances yet.</p>
            <Link to="/user/submit" className="mt-4 inline-block text-govblue-600 font-medium text-sm hover:underline">
              Submit your first complaint
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complaints.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ComplaintCard complaintData={item} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
