import * as React from "react";

interface MultiSelectProps {
  options: { value: string; label: string }[];
  selected: string[];
  onSelectChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onSelectChange,
  placeholder,
  disabled,
}) => {
  return (
    <div className="relative">
      <select
        multiple
        value={selected}
        onChange={(e) =>
          onSelectChange(
            Array.from(e.target.selectedOptions).map((option) => option.value)
          )
        }
        className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {selected.length === 0 && placeholder && (
        <span className="absolute left-2 top-2 text-gray-500 pointer-events-none">
          {placeholder}
        </span>
      )}
    </div>
  );
};
