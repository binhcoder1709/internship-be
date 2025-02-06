import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GoogleSheetsProvider {
    private convertToExportUrl(sharingUrl: string, sheetName?: string): string {
        // Extract ID từ sharing URL
        const matches = sharingUrl.match(/[-\w]{25,}/);
        if (!matches) {
            throw new Error('Invalid Google Sheets URL');
        }
        const spreadsheetId = matches[0];

        // Tạo export URL với sheet cụ thể nếu được chỉ định
        if (sheetName) {
            return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
        }
        return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
    }

    async readSpreadsheet(sharingUrl: string, sheetName?: string) {
        try {
            const exportUrl = this.convertToExportUrl(sharingUrl, sheetName);
            const response = await axios.get(exportUrl);
            return response.data;
        } catch (error) {
            console.error('Error reading spreadsheet:', error);
            throw error;
        }
    }

    // Hàm mới để đọc nhiều sheet
    async readMultipleSheets(sharingUrl: string, sheetNames: string[]) {
        try {
            const results = {};
            for (const sheetName of sheetNames) {
                const data = await this.readSpreadsheet(sharingUrl, sheetName);
                results[sheetName] = data;
            }
            return results;
        } catch (error) {
            console.error('Error reading multiple sheets:', error);
            throw error;
        }
    }
} 