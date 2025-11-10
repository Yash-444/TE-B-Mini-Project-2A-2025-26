import React from 'react';

function StepsIndicator({ currentStep }) {
  const steps = [
    { id: 1, label: 'Upload' },
    { id: 2, label: 'Visualize' },
    { id: 3, label: 'Customize' },
    { id: 4, label: 'Pricing' },
    { id: 5, label: 'Complete' }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold ${
              step.id <= currentStep 
                ? 'bg-indigo-700 text-white' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              {step.id}
            </div>
            <span className={`text-sm ${step.id <= currentStep ? 'text-indigo-700' : 'text-gray-500'}`}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-16 h-1 ${step.id < currentStep ? 'bg-indigo-700' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default StepsIndicator;
