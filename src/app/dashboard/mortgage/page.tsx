'use client';
import { useState, useMemo } from 'react';
import { DollarSign, Percent, Calendar, Home, Calculator, TrendingUp, FileText, CheckCircle } from 'lucide-react';

export default function MortgagePage() {
  const [homePrice, setHomePrice] = useState(350000);
  const [downPayment, setDownPayment] = useState(70000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTerm, setLoanTerm] = useState(30);
  const [propertyTax, setPropertyTax] = useState(3200);
  const [homeInsurance, setHomeInsurance] = useState(1200);
  const [pmiRate, setPmiRate] = useState(0.5);

  const loanAmount = homePrice - downPayment;
  const downPaymentPercent = (downPayment / homePrice) * 100;
  const needsPMI = downPaymentPercent < 20;

  const breakdown = useMemo(() => {
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm * 12;
    const monthlyPrincipalInterest = monthlyRate > 0
      ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) / (Math.pow(1 + monthlyRate, numPayments) - 1)
      : loanAmount / numPayments;

    const monthlyTax = propertyTax / 12;
    const monthlyInsurance = homeInsurance / 12;
    const monthlyPMI = needsPMI ? (loanAmount * (pmiRate / 100)) / 12 : 0;
    const totalMonthly = monthlyPrincipalInterest + monthlyTax + monthlyInsurance + monthlyPMI;

    // Amortization schedule
    const schedule: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];
    let balance = loanAmount;
    for (let m = 1; m <= numPayments; m++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPrincipalInterest - interestPayment;
      balance = Math.max(0, balance - principalPayment);
      schedule.push({ month: m, payment: monthlyPrincipalInterest, principal: principalPayment, interest: interestPayment, balance });
    }

    return {
      monthlyPrincipalInterest: Math.round(monthlyPrincipalInterest * 100) / 100,
      monthlyTax: Math.round(monthlyTax * 100) / 100,
      monthlyInsurance: Math.round(monthlyInsurance * 100) / 100,
      monthlyPMI: Math.round(monthlyPMI * 100) / 100,
      totalMonthly: Math.round(totalMonthly * 100) / 100,
      totalInterest: Math.round((monthlyPrincipalInterest * numPayments - loanAmount) * 100) / 100,
      totalCost: Math.round((monthlyPrincipalInterest * numPayments) * 100) / 100,
      schedule,
    };
  }, [loanAmount, interestRate, loanTerm, propertyTax, homeInsurance, needsPMI, pmiRate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Calculator className="text-green-500" /> Mortgage Calculator</h1>
        <p className="text-gray-500 mt-1">Full breakdown with amortization schedule</p>
      </div>

      {/* Input Form */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Home size={18} /> Loan Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1"><DollarSign size={14} /> Home Price</label>
            <input type="number" value={homePrice} onChange={e => setHomePrice(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1"><DollarSign size={14} /> Down Payment (${downPayment.toLocaleString()} / {downPaymentPercent.toFixed(1)}%)</label>
            <input type="number" value={downPayment} onChange={e => setDownPayment(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1"><Percent size={14} /> Interest Rate ({interestRate}%)</label>
            <input type="number" step="0.1" value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1"><Calendar size={14} /> Loan Term ({loanTerm} years)</label>
            <select value={loanTerm} onChange={e => setLoanTerm(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg">
              <option value={15}>15 years</option>
              <option value={20}>20 years</option>
              <option value={30}>30 years</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Annual Property Tax</label>
            <input type="number" value={propertyTax} onChange={e => setPropertyTax(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Annual Home Insurance</label>
            <input type="number" value={homeInsurance} onChange={e => setHomeInsurance(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-500">Principal & Interest</p>
          <p className="text-2xl font-bold text-blue-600">${breakdown.monthlyPrincipalInterest.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-500">Property Tax</p>
          <p className="text-2xl font-bold">${breakdown.monthlyTax.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-500">Home Insurance</p>
          <p className="text-2xl font-bold">${breakdown.monthlyInsurance.toLocaleString()}</p>
        </div>
        {needsPMI && (
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-sm text-gray-500">PMI</p>
            <p className="text-2xl font-bold text-orange-600">${breakdown.monthlyPMI.toLocaleString()}</p>
          </div>
        )}
        <div className="bg-green-50 p-4 rounded-lg shadow border border-green-300">
          <p className="text-sm text-green-700 font-medium">Total Monthly Payment</p>
          <p className="text-3xl font-bold text-green-700">${breakdown.totalMonthly.toLocaleString()}</p>
        </div>
      </div>

      {/* Loan Summary */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp size={18} /> Loan Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Loan Amount:</span> <strong>${loanAmount.toLocaleString()}</strong></div>
          <div><span className="text-gray-500">Total Interest:</span> <strong>${breakdown.totalInterest.toLocaleString()}</strong></div>
          <div><span className="text-gray-500">Total Cost (P+I):</span> <strong>${breakdown.totalCost.toLocaleString()}</strong></div>
          <div><span className="text-gray-500">Down Payment:</span> <strong>{downPaymentPercent.toFixed(1)}%</strong></div>
        </div>
        {needsPMI && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700 flex items-center gap-2">
            <Percent size={16} /> PMI required (down payment &lt; 20%). PMI will be removed once you reach 20% equity.
          </div>
        )}
      </div>

      {/* Amortization Schedule */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="p-4 border-b bg-gray-50"><h2 className="font-semibold flex items-center gap-2"><FileText size={18} /> Amortization Schedule</h2></div>
        <div className="overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left p-3 font-medium">Month</th>
                <th className="text-right p-3 font-medium">Payment</th>
                <th className="text-right p-3 font-medium">Principal</th>
                <th className="text-right p-3 font-medium">Interest</th>
                <th className="text-right p-3 font-medium">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {breakdown.schedule.filter(s => s.month % 12 === 0 || s.month === 1).map(row => (
                <tr key={row.month} className="hover:bg-gray-50">
                  <td className="p-3 font-medium">{row.month} ({Math.ceil(row.month / 12)}yr)</td>
                  <td className="p-3 text-right">${row.payment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className="p-3 text-right text-green-600">${row.principal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className="p-3 text-right text-red-600">${row.interest.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className="p-3 text-right font-medium">${row.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t bg-gray-50 text-xs text-gray-500">Showing yearly summary (first payment + each December). Full {loanTerm}-year schedule has {loanTerm * 12} payments.</div>
      </div>

      {/* Pre-Approval Tracker */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><CheckCircle size={18} /> Pre-Approval Checklist</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Gather W-2s for last 2 years',
            'Collect pay stubs (last 30 days)',
            'Bank statements (last 2 months)',
            'Tax returns (last 2 years)',
            'Government-issued ID',
            'Proof of assets/savings',
            'Employment verification info',
            'List of monthly debts & payments',
            'Credit report review',
            'Choose a lender & apply',
          ].map((item, i) => (
            <label key={i} className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
