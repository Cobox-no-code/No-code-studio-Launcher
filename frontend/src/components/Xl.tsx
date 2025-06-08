"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface DownloadButtonProps {
    buttonText: string;
    data: Record<string, any>[]; // Array of objects
    fileName?: string;
}

const getCurrentDateTime = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(
        now.getHours()
    )}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
};

const isUUID = (value: any): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return typeof value === "string" && uuidRegex.test(value);
};

export const DownloadButton: React.FC<DownloadButtonProps> = ({
    buttonText,
    data,
    fileName = "exported-data",
}) => {
    const handleDownload = () => {
        if (!data || data.length === 0) return;

        const cleanedData = data.map((row) => {
            const newRow: Record<string, any> = {};
            for (const key in row) {
                const lowerKey = key.toLowerCase();
                const value = row[key];

                const isIdField = lowerKey.includes("id");
                const isCreatedUpdatedField = lowerKey.includes("created") || lowerKey.includes("updated");
                const isUuidValue = isUUID(value);

                if (!isIdField && !isCreatedUpdatedField && !isUuidValue) {
                    newRow[key] = value;
                }
            }
            return newRow;
        });

        const keys = Object.keys(cleanedData[0] || {});
        const filteredKeys = keys.filter((key) =>
            cleanedData.some((row) => row[key] !== null && row[key] !== undefined && row[key] !== "")
        );

        const finalData = cleanedData.map((row) => {
            const newRow: Record<string, any> = {};
            filteredKeys.forEach((key) => {
                newRow[key] = row[key];
            });
            return newRow;
        });

        const worksheet = XLSX.utils.json_to_sheet(finalData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
        });

        const blob = new Blob([excelBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const fullFileName = `${fileName}_${getCurrentDateTime()}.xlsx`;
        saveAs(blob, fullFileName);
    };

    return (

        <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-1"
        >
            <Download className="mr-2 h-4 w-4" />
            {buttonText}
        </Button>
    );
};
