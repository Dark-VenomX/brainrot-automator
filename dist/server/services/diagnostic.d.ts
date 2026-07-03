export interface DiagnosticResult {
    ok: boolean;
    output_path: string;
    script: string;
    title: string;
    hashtags: string[];
    word_count: number;
    audio_duration_ms: number;
    video_info: {
        width: number;
        height: number;
        duration: number;
        fps: number;
        smart_cropped: boolean;
    };
    steps: {
        step: string;
        ok: boolean;
        detail?: string;
    }[];
    error?: string;
}
export declare class DiagnosticService {
    runTestRender(opts?: {
        url?: string;
        start?: string;
        end?: string;
        topic?: string;
    }): Promise<DiagnosticResult>;
}
export declare const diagnosticService: DiagnosticService;
//# sourceMappingURL=diagnostic.d.ts.map