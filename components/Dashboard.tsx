import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Download, CheckCircle, XCircle, AlertTriangle, ShieldAlert, FileOutput } from 'lucide-react';
import { ProcessingResult, EmailStatus } from '../types';
import { downloadCSV } from '../services/emailCleaner';
import StatsCard from './StatsCard';

interface DashboardProps {
  results: ProcessingResult;
  onReset: () => void;
}

const COLORS = {
  [EmailStatus.VALID]: '#10b981', // Emerald 500
  [EmailStatus.INVALID_FORMAT]: '#ef4444', // Red 500
  [EmailStatus.DUPLICATE]: '#f59e0b', // Amber 500
  [EmailStatus.DISPOSABLE]: '#6366f1', // Indigo 500
  [EmailStatus.TYPO_DOMAIN]: '#ec4899', // Pink 500
  [EmailStatus.ROLE_BASED]: '#8b5cf6', // Violet 500
  [EmailStatus.MISSING_MX]: '#64748b', // Slate 500
};

const LABELS = {
    [EmailStatus.VALID]: 'Valid',
    [EmailStatus.INVALID_FORMAT]: 'Syntax Error',
    [EmailStatus.DUPLICATE]: 'Duplicate',
    [EmailStatus.DISPOSABLE]: 'Disposable',
    [EmailStatus.TYPO_DOMAIN]: 'Bad Domain',
    [EmailStatus.ROLE_BASED]: 'Role Based',
    [EmailStatus.MISSING_MX]: 'No MX Record',
}

const Dashboard: React.FC<DashboardProps> = ({ results, onReset }) => {
  const { stats, validRecords, invalidRecords } = results;

  const pieData = [
    { name: 'Valid', value: stats.totalValid, color: COLORS[EmailStatus.VALID] },
    { name: 'Invalid/Filtered', value: stats.totalProcessed - stats.totalValid, color: COLORS[EmailStatus.INVALID_FORMAT] },
  ];

  const barData = Object.entries(stats.invalidBreakdown)
    .filter(([_, value]) => (value as number) > 0)
    .map(([key, value]) => ({
      name: LABELS[key as EmailStatus],
      value: value as number,
      key: key
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Processed" 
          value={stats.totalProcessed} 
          icon={FileOutput} 
          colorClass="text-brand-600 bg-brand-100" 
        />
        <StatsCard 
          title="Valid Emails" 
          value={stats.totalValid} 
          icon={CheckCircle} 
          colorClass="text-emerald-600 bg-emerald-100" 
        />
        <StatsCard 
          title="Duplicates Removed" 
          value={stats.totalDuplicates} 
          icon={AlertTriangle} 
          colorClass="text-amber-600 bg-amber-100" 
        />
        <StatsCard 
          title="Invalid/Risky" 
          value={stats.totalProcessed - stats.totalValid} 
          icon={XCircle} 
          colorClass="text-red-600 bg-red-100" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm col-span-1">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Quality Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm col-span-1 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Rejection Reasons</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.key as EmailStatus] || '#8884d8'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
                <h3 className="text-xl font-bold text-slate-900">Your list is ready!</h3>
                <p className="text-slate-500 mt-1">Download your clean list (emails only) to import into your marketing tool.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                 <button
                    onClick={() => downloadCSV(validRecords, 'clean_list.csv', ['email'])}
                    className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
                >
                    <Download className="w-5 h-5" />
                    <span>Download Clean List ({validRecords.length})</span>
                </button>
                <button
                    onClick={() => downloadCSV(invalidRecords, 'dirty_list.csv', ['email', 'status'])}
                    className="flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-semibold transition-colors border border-slate-200"
                >
                    <Download className="w-5 h-5" />
                    <span>Download Rejects ({invalidRecords.length})</span>
                </button>
            </div>
        </div>
      </div>

       {/* Detailed Preview Table (First 50) */}
       <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Review Rejected Entries (Preview)</h3>
            <span className="text-xs text-slate-500">First 10 records</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Reason</th>
                        <th className="px-6 py-3">Source File</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {invalidRecords.slice(0, 10).map((record, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-6 py-3 font-mono text-slate-700">{record.email || record.original || '<empty>'}</td>
                            <td className="px-6 py-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800`} 
                                      style={{ color: COLORS[record.status], backgroundColor: `${COLORS[record.status]}20` }}>
                                    {LABELS[record.status]}
                                </span>
                            </td>
                            <td className="px-6 py-3 text-slate-500">{record.sourceFile}</td>
                        </tr>
                    ))}
                    {invalidRecords.length === 0 && (
                        <tr>
                            <td colSpan={3} className="px-6 py-8 text-center text-slate-400">No rejected records found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
       </div>

      <div className="text-center pt-8">
          <button onClick={onReset} className="text-slate-500 hover:text-brand-600 text-sm font-medium underline underline-offset-4">
              Start Over with New Files
          </button>
      </div>

    </div>
  );
};

export default Dashboard;
