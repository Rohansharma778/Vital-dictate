import React from 'react';
import { User, Activity, FileText, Stethoscope, Pill, AlertCircle, Clock, CheckCircle, ClipboardList } from 'lucide-react';

const MedicalSummary = ({ summaryData }) => {
  let parsedData = null;
  
  if (summaryData) {
    try {
      if (typeof summaryData === "string") {
        // Strip markdown blocks
        let cleanedText = summaryData.replace(/```json/i, "").replace(/```/g, "").trim();
        
        // Remove trailing commas at the very end of the string
        cleanedText = cleanedText.replace(/,\s*$/, "");
        
        // Force a closing brace if the LLM cut off early
        if (!cleanedText.endsWith("}")) {
          cleanedText += "}";
        }
        
        parsedData = JSON.parse(cleanedText);
      } else {
        parsedData = summaryData;
      }
    } catch (error) {
      console.error("Error parsing LLM output:", error);
    }
  }

  return (
    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-[calc(100vh-3rem)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="text-blue-600" size={24} />
          AI Medical Summary
        </h2>
      </div>

      <div className="overflow-y-auto flex-1 pr-2 space-y-6">
        {/* Patient Demographics */}
        <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-4">
          <User className="text-blue-500" size={32} />
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              Patient Name: {parsedData?.patientName || "Patient Data Pending"}
            </h3>
            <p className="text-gray-600 text-sm">
              Age: {parsedData?.patientAge || "--"} | Gender: {parsedData?.patientGender || "--"}
            </p>
          </div>
        </div>

        {/* Clinical Sections */}
        <div className="space-y-4">
          <Section title="CLINICAL SUMMARY" icon={<Activity size={18} />} content={parsedData?.clinicalSummary} />
          <Section title="CHIEF COMPLAINTS" icon={<AlertCircle size={18} />} content={parsedData?.chiefComplaints} />
          <Section title="SYMPTOMS" icon={<Stethoscope size={18} />} content={parsedData?.symptoms} />
          <Section title="CLINICAL IMPRESSION" icon={<CheckCircle size={18} />} content={parsedData?.clinicalImpression} />
          <Section title="MEDICATIONS" icon={<Pill size={18} />} content={parsedData?.medications} />
          <Section title="EXAMINATIONS & TESTS" icon={<ClipboardList size={18} />} content={parsedData?.examinationsAndTests} />
          <Section title="ALLERGIES" icon={<AlertCircle size={18} />} content={parsedData?.allergies} />
          <Section title="PAST MEDICAL HISTORY" icon={<Clock size={18} />} content={parsedData?.pastMedicalHistory} />
        </div>
      </div>
    </div>
  );
};

// Helper component for clean section rendering
const Section = ({ title, icon, content }) => {
  const cleanContent = typeof content === 'string' ? content.trim() : content;
  const isInvalid = !cleanContent || cleanContent === "{}" || cleanContent === "[]";

  return (
    <div>
      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-2">
        <span className="text-gray-400">{icon}</span> {title}
      </h4>
      <div className="bg-gray-50 p-3 rounded border border-gray-100 text-gray-700 whitespace-pre-wrap min-h-[3rem]">
        {isInvalid ? "No data provided" : cleanContent}
      </div>
    </div>
  );
};

export default MedicalSummary;