import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class Judge0Provider {
    private readonly url = process.env.JUDGE0_API_URL;

    async getLanguages(): Promise<GetLanguagesResponse> {
        const response = await axios.get(`${this.url}/languages`);
        return response.data;
    }

    async getLanguageDetail(languageId: number): Promise<GetLanguageDetailResponse> {
        const response = await axios.get(`${this.url}/languages/${languageId}`);
        return response.data;
    }

    async submitCode(sourceCode: string, languageId: number, base64Encoded: boolean = true): Promise<Judge0SubmissionResponse> {
        try {
            // Encode source code to base64 if needed
            const encodedCode = base64Encoded ? Buffer.from(sourceCode).toString('base64') : sourceCode;

            const submission = await axios.post(
                `${this.url}/submissions?base64_encoded=${base64Encoded}`,
                {
                    source_code: encodedCode,
                    language_id: languageId,
                    stdin: '',
                }
            );

            const token = submission.data.token;
            
            // Poll for result
            let result;
            do {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const response = await axios.get(
                    `${this.url}/submissions/${token}?base64_encoded=${base64Encoded}`
                );
                result = response.data;
            } while (result.status.id === 1 || result.status.id === 2);

            return result;
        } catch (error) {
            console.error('Judge0 submission error:', error);
            throw error;
        }
    }
}


export interface Judge0LanguageMini {
    id: number;
    name: string;
}

export interface Judge0LanguageDetail extends Judge0LanguageMini {
    is_archived: boolean, // true if the language is archived
    source_file: string, // source file name
    compile_cmd: string | null, // compile command
    run_cmd: string // run command
}

export type GetLanguagesResponse = Judge0LanguageMini[];

export type GetLanguageDetailResponse = Judge0LanguageDetail;


export interface Judge0SubmissionResponse {
    stdout: string;
    time: string;
    memory: number;
    stderr: string | null;
    token: string;
    compile_output: string | null;
    message: string | null;
    status: {
        id: number;
        description: string;
    }
}