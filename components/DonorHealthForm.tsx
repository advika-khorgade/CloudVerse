'use client';
import { useState } from 'react';
import { DonorHealthDetails } from '@/lib/types';
import { useTheme } from '@/context/ThemeContext';

interface Props { onSave: (details: DonorHealthDetails) => void; initial?: DonorHealthDetails; }

const defaultHealth: DonorHealthDetails = {
  weight: undefined, height: undefined, bmi: undefined,
  smokingStatus: 'never', alcoholUse: 'none',
  diabetes: false, hypertension: false, heartDisease: false,
  kidneyDisease: false, liverDisease: false, cancer: false,
  infectiousDiseases: '', medications: '', allergies: '',
  lastMedicalCheckup: '', additionalNotes: '',
};

export default function DonorHealthForm({ onSave, initial }: Props) {
  const { theme } = useTheme();
  const [form, setForm] = useState<DonorHealthDetails>(initial || defaultHealth);
  const isDark = theme === 'dark';

  const labelCls = `block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`;
  const sectionCls = `${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'} border rounded-xl p-4 space-y-4`;

  const toggle = (field: keyof DonorHealthDetails) =>
    setForm(f => ({ ...f, [field]: !f[field as keyof typeof f] }));

  const handleWeightHeight = (w?: number, h?: number) => {
    const weight = w ?? form.weight;
    const height = h ?? form.height;
    const bmi = weight && height ? parseFloat((weight / ((height / 100) ** 2)).toFixed(1)) : undefined;
    setForm(f => ({ ...f, weight, height, bmi }));
  };

  const ToggleBtn = ({ field, label }: { field: keyof DonorHealthDetails; label: string }) => (
    <button type="button" onClick={() => toggle(field)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
        form[field]
          ? 'bg-red-500/20 border-red-500/50 text-red-400'
          : isDark ? 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500' : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
      }`}>
      <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${form[field] ? 'bg-red-500 border-red-500 text-white' : isDark ? 'border-slate-500' : 'border-slate-400'}`}>
        {form[field] ? '✓' : ''}
      </span>
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Physical stats */}
      <div className={sectionCls}>
        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Physical Information</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Weight (kg)</label>
            <input type="number" className="input" placeholder="70"
              value={form.weight || ''} onChange={e => handleWeightHeight(Number(e.target.value) || undefined, undefined)} />
          </div>
          <div>
            <label className={labelCls}>Height (cm)</label>
            <input type="number" className="input" placeholder="170"
              value={form.height || ''} onChange={e => handleWeightHeight(undefined, Number(e.target.value) || undefined)} />
          </div>
          <div>
            <label className={labelCls}>BMI (auto)</label>
            <div className={`input flex items-center ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {form.bmi ? (
                <span className={form.bmi < 18.5 ? 'text-yellow-400' : form.bmi < 25 ? 'text-green-400' : form.bmi < 30 ? 'text-yellow-400' : 'text-red-400'}>
                  {form.bmi} {form.bmi < 18.5 ? '(Underweight)' : form.bmi < 25 ? '(Normal)' : form.bmi < 30 ? '(Overweight)' : '(Obese)'}
                </span>
              ) : <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Auto-calculated</span>}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Smoking Status</label>
            <select className="input" value={form.smokingStatus} onChange={e => setForm(f => ({ ...f, smokingStatus: e.target.value as DonorHealthDetails['smokingStatus'] }))}>
              <option value="never">Never smoked</option>
              <option value="former">Former smoker</option>
              <option value="current">Current smoker</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Alcohol Use</label>
            <select className="input" value={form.alcoholUse} onChange={e => setForm(f => ({ ...f, alcoholUse: e.target.value as DonorHealthDetails['alcoholUse'] }))}>
              <option value="none">None</option>
              <option value="occasional">Occasional</option>
              <option value="regular">Regular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Medical conditions */}
      <div className={sectionCls}>
        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Medical Conditions</p>
        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Select all that apply</p>
        <div className="flex flex-wrap gap-2">
          <ToggleBtn field="diabetes" label="Diabetes" />
          <ToggleBtn field="hypertension" label="Hypertension" />
          <ToggleBtn field="heartDisease" label="Heart Disease" />
          <ToggleBtn field="kidneyDisease" label="Kidney Disease" />
          <ToggleBtn field="liverDisease" label="Liver Disease" />
          <ToggleBtn field="cancer" label="Cancer" />
        </div>
        <div>
          <label className={labelCls}>Infectious Diseases (HIV, Hepatitis B/C, etc.)</label>
          <input type="text" className="input" placeholder="None / specify if any"
            value={form.infectiousDiseases} onChange={e => setForm(f => ({ ...f, infectiousDiseases: e.target.value }))} />
        </div>
      </div>

      {/* Medications & other */}
      <div className={sectionCls}>
        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Medications & Other</p>
        <div>
          <label className={labelCls}>Current Medications</label>
          <input type="text" className="input" placeholder="e.g. Metformin, Lisinopril, or None"
            value={form.medications} onChange={e => setForm(f => ({ ...f, medications: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls}>Known Allergies</label>
          <input type="text" className="input" placeholder="e.g. Penicillin, or None"
            value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls}>Last Medical Checkup</label>
          <input type="date" className="input"
            value={form.lastMedicalCheckup || ''} onChange={e => setForm(f => ({ ...f, lastMedicalCheckup: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls}>Additional Notes</label>
          <textarea className="input resize-none" rows={3} placeholder="Any other relevant medical information..."
            value={form.additionalNotes} onChange={e => setForm(f => ({ ...f, additionalNotes: e.target.value }))} />
        </div>
      </div>

      <button type="button" onClick={() => onSave(form)}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 rounded-xl text-sm transition-all">
        Save Health Details
      </button>
    </div>
  );
}
