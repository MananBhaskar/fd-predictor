import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Database, BarChart3, Plus } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function FDTrendPredictor() {
  const [rates, setRates] = useState([]);
  const [banks, setBanks] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedTenure, setSelectedTenure] = useState(12);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('predict');
  
  // Form states
  const [newRate, setNewRate] = useState({
    bankName: '',
    tenure: 12,
    interestRate: '',
    minAmount: 10000
  });

  useEffect(() => {
    fetchRates();
    fetchBanks();
    fetchPredictions();
  }, []);

  const fetchRates = async () => {
    try {
      const response = await fetch(`${API_URL}/fd-rates`);
      const data = await response.json();
      setRates(data);
    } catch (error) {
      console.error('Error fetching rates:', error);
    }
  };

  const fetchBanks = async () => {
  try {
    console.log("Fetching banks..."); // 👈 log start
    const response = await fetch(`${API_URL}/banks`);
    const data = await response.json();
    console.log("Banks API response:", data); // 👈 log response

    const bankNames = data.map(bank =>
      typeof bank === "string" ? bank : bank.bankName
    );
    console.log("Processed bank names:", bankNames); // 👈 log processed names

    setBanks(bankNames);
    if (bankNames.length > 0) setSelectedBank(bankNames[0]);
  } catch (error) {
    console.error("Error fetching banks:", error);
  }
};



  const fetchPredictions = async () => {
    try {
      const response = await fetch(`${API_URL}/predictions`);
      const data = await response.json();
      setPredictions(data);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const handlePredict = async () => {
    if (!selectedBank) {
      alert('Please select a bank');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bankName: selectedBank, 
          tenure: selectedTenure 
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPrediction(data);
        fetchPredictions();
      } else {
        alert(data.error || 'Prediction failed');
      }
    } catch (error) {
      alert('Error generating prediction: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRate = async () => {
    if (!newRate.bankName || !newRate.interestRate) {
      alert('Please fill all required fields');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/fd-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRate)
      });
      
      if (response.ok) {
        alert('FD Rate added successfully!');
        setNewRate({ bankName: '', tenure: 12, interestRate: '', minAmount: 10000 });
        fetchRates();
        fetchBanks();
      }
    } catch (error) {
      alert('Error adding rate: ' + error.message);
    }
  };

  const handleSeedData = async () => {
    if (!window.confirm('This will replace all existing data. Continue?')) return;
    
    try {
      const response = await fetch(`${API_URL}/seed`, { method: 'POST' });
      const data = await response.json();
      alert(data.message);
      fetchRates();
      fetchBanks();
    } catch (error) {
      alert('Error seeding data: ' + error.message);
    }
  };

  const handleDeleteRate = async (id) => {
    if (!window.confirm('Delete this rate?')) return;
    
    try {
      await fetch(`${API_URL}/fd-rates/${id}`, { method: 'DELETE' });
      fetchRates();
    } catch (error) {
      alert('Error deleting rate: ' + error.message);
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === 'increasing') return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (trend === 'decreasing') return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-gray-500" />;
  };

  const getChartData = () => {
    if (!prediction || !prediction.historicalData) return [];
    
    const historical = prediction.historicalData.map((d, i) => ({
      index: i + 1,
      date: new Date(d.date).toLocaleDateString(),
      rate: d.rate,
      type: 'Historical'
    }));
    
    const predicted = {
      index: historical.length + 1,
      date: 'Predicted',
      rate: prediction.prediction,
      type: 'Predicted'
    };
    
    return [...historical, predicted];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">FD Trend Predictor</h1>
          <p className="text-gray-600">Automated Fixed Deposit interest rate trend analysis and prediction</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('predict')}
              className={`px-6 py-3 font-medium ${activeTab === 'predict' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              <BarChart3 className="inline w-5 h-5 mr-2" />
              Predict Trends
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-6 py-3 font-medium ${activeTab === 'add' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              <Plus className="inline w-5 h-5 mr-2" />
              Add Rate
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`px-6 py-3 font-medium ${activeTab === 'data' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              <Database className="inline w-5 h-5 mr-2" />
              View Data
            </button>
          </div>
        </div>

        {/* Predict Tab */}
        {activeTab === 'predict' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Prediction Controls */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Generate Prediction</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank</label>
                  <select
  value={selectedBank}
  onChange={(e) => setSelectedBank(e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
>
  {banks.map((bank) => (
    <option key={bank} value={bank}>{bank}</option>
  ))}
</select>

                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tenure (months)</label>
                  <select
                    value={selectedTenure}
                    onChange={(e) => setSelectedTenure(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={6}>6 months</option>
                    <option value={12}>12 months</option>
                    <option value={24}>24 months</option>
                    <option value={36}>36 months</option>
                  </select>
                </div>

                <button
                  onClick={handlePredict}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  {loading ? 'Analyzing...' : 'Generate Prediction'}
                </button>

                <button
                  onClick={handleSeedData}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
                >
                  Seed Sample Data
                </button>
              </div>

              {/* Recent Predictions */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Predictions</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {predictions.slice(0, 5).map((pred, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg text-sm">
                      <div className="font-medium">{pred.bankName}</div>
                      <div className="text-gray-600">{pred.tenure}M: {pred.predictedRate}%</div>
                      <div className="text-xs text-gray-500">Confidence: {pred.confidence}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Prediction Results */}
            <div className="lg:col-span-2 space-y-6">
              {prediction && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-sm text-gray-600 mb-1">Predicted Rate</div>
                      <div className="text-2xl font-bold text-blue-600">{prediction.prediction}%</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-sm text-gray-600 mb-1">Confidence</div>
                      <div className="text-2xl font-bold text-green-600">{prediction.confidence}%</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-sm text-gray-600 mb-1">Trend</div>
                      <div className="flex items-center gap-2 mt-1">
                        {getTrendIcon(prediction.trend)}
                        <span className="font-semibold capitalize">{prediction.trend}</span>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-sm text-gray-600 mb-1">Data Points</div>
                      <div className="text-2xl font-bold text-gray-700">{prediction.dataPoints}</div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Rate Trend Analysis</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="rate" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {!prediction && (
                <div className="bg-white p-12 rounded-lg shadow-sm text-center">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a bank and tenure, then click Generate Prediction to see the analysis</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Rate Tab */}
        {activeTab === 'add' && (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Add New FD Rate</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <input
                  type="text"
                  value={newRate.bankName}
                  onChange={(e) => setNewRate({...newRate, bankName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tenure (months)</label>
                <select
                  value={newRate.tenure}
                  onChange={(e) => setNewRate({...newRate, tenure: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                  <option value={24}>24 months</option>
                  <option value={36}>36 months</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newRate.interestRate}
                  onChange={(e) => setNewRate({...newRate, interestRate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Amount (₹)</label>
                <input
                  type="number"
                  value={newRate.minAmount}
                  onChange={(e) => setNewRate({...newRate, minAmount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                onClick={handleAddRate}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
              >
                Add FD Rate
              </button>
            </div>
          </div>
        )}

        {/* View Data Tab */}
        {activeTab === 'data' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Historical FD Rates</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Bank</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tenure</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rate (%)</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Min Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rates.map((rate) => (
                    <tr key={rate._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{rate.bankName}</td>
                      <td className="px-4 py-3 text-sm">{rate.tenure} months</td>
                      <td className="px-4 py-3 text-sm font-medium">{rate.interestRate}%</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(rate.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">₹{rate.minAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleDeleteRate(rate._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rates.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No data available. Add some FD rates or seed sample data.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}