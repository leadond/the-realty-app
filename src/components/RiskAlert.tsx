import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

type Risk = {
  riskLevel: 'GREEN' | 'YELLOW' | 'RED';
  riskScore: number;
  warnings: string[];
  contactedByOrgs: number;
  contactedByAgents: number;
};

const STYLES = {
  GREEN: { box: 'bg-green-50 border-green-200', icon: <CheckCircle2 className="w-5 h-5 text-green-600" />, title: 'Low Risk — Safe to Contact' },
  YELLOW: { box: 'bg-yellow-50 border-yellow-200', icon: <AlertCircle className="w-5 h-5 text-yellow-600" />, title: 'Moderate Risk — Multiple Contacts' },
  RED: { box: 'bg-red-50 border-red-200', icon: <AlertTriangle className="w-5 h-5 text-red-600" />, title: 'High Risk — Proceed with Caution' },
};

export function RiskAlert({ risk }: { risk: Risk }) {
  const style = STYLES[risk.riskLevel];
  return (
    <div className={`border rounded-lg p-4 ${style.box}`}>
      <div className="flex gap-3">
        {style.icon}
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{style.title}</h3>
          {risk.warnings.length > 0 && (
            <ul className="mt-2 text-sm space-y-1">
              {risk.warnings.map((w, i) => <li key={i}>• {w}</li>)}
            </ul>
          )}
          <p className="text-xs mt-2 opacity-70">
            Risk score: {risk.riskScore}/100 · Contacted by {risk.contactedByAgents} agent(s) across {risk.contactedByOrgs} brokerage(s)
          </p>
        </div>
      </div>
    </div>
  );
}
