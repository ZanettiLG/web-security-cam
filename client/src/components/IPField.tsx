/**
 * IPField Component
 * 
 * A custom TextField component for IP address input with automatic formatting:
 * - Automatically adds dots as separators
 * - Validates IP address format in real-time
 * - Prevents invalid characters (only numbers and dots allowed)
 * - Limits each segment to 0-255 range
 * - Maximum 3 digits per segment
 * - Shows validation errors for incomplete or invalid IPs
 * 
 * Usage:
 * <IPField
 *   value={ipAddress}
 *   onChange={(value) => setIpAddress(value)}
 *   label="IP Address"
 *   required
 * />
 */

import React, { useState, useEffect } from "react";
import { TextField, TextFieldProps } from "@mui/material";

interface IPFieldProps extends Omit<TextFieldProps, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
}

const validateIP = (ip: string): boolean => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
};

const IPField: React.FC<IPFieldProps> = ({
  value,
  error,
  onChange,
  helperText,
  ...textFieldProps
}) => {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    
    // Only allow numbers and dots
    const cleanValue = value.replace(/[^\d.]/g, '');
    
    // Prevent multiple consecutive dots
    const noMultipleDots = cleanValue.replace(/\.+/g, '.');
    
    // Prevent dot at the beginning
    const noLeadingDot = noMultipleDots.startsWith('.') ? noMultipleDots.slice(1) : noMultipleDots;
    
    // Split by dots and validate each segment
    const segments = noLeadingDot.split('.');
    const validSegments = segments.map(segment => {
      // Limit to 3 digits per segment
      const limitedSegment = segment.slice(0, 3);
      // Convert to number and validate range
      const num = parseInt(limitedSegment, 10);
      if (isNaN(num) || num < 0 || num > 255) {
        return segment; // Keep original if invalid
      }
      return limitedSegment;
    });
    
    // Join segments with dots, but don't add trailing dot
    const formattedValue = validSegments.join('.');
    
    setInputValue(formattedValue);
    onChange(formattedValue);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const { key, target } = event;
    const input = target as HTMLInputElement;
    const cursorPosition = input.selectionStart || 0;
    const value = input.value;

    // Allow navigation keys
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Tab"].includes(key)) {
      return;
    }

    // Allow deletion keys
    if (["Backspace", "Delete"].includes(key)) {
      return;
    }

    // Allow only numbers and dots
    if (!/[\d.]/.test(key)) {
      event.preventDefault();
      return;
    }

    // Prevent multiple consecutive dots
    if (key === "." && value[cursorPosition - 1] === ".") {
      event.preventDefault();
      return;
    }

    // Prevent dot at the beginning
    if (key === "." && cursorPosition === 0) {
      event.preventDefault();
      return;
    }

    // Prevent more than 3 dots (4 segments)
    if (key === "." && (value.match(/\./g) || []).length >= 3) {
      event.preventDefault();
      return;
    }

    // Prevent more than 3 digits in a segment
    const currentSegment = value.slice(0, cursorPosition).split('.').pop() || '';
    if (/\d/.test(key) && currentSegment.length >= 3) {
      event.preventDefault();
      return;
    }
  };

  const isCompleteIP = inputValue.split(".").length === 4;
  const isValidIP = isCompleteIP && validateIP(inputValue);
  const showError = error || (inputValue && isCompleteIP && !isValidIP);

  return (
    <TextField
      {...textFieldProps}
      value={inputValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      error={showError}
      helperText={
        showError 
          ? helperText || "Please enter a valid IP address (e.g., 192.168.1.1)"
          : textFieldProps.helperText
      }
      inputProps={{
        ...textFieldProps.inputProps,
        maxLength: 15, // Maximum length for IP address (xxx.xxx.xxx.xxx)
        pattern: "[0-9.]*", // Only allow numbers and dots
      }}
    />
  );
};

export default IPField;
