import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

type TickerMapFile = {
    tickers: Record<string, number>;
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const ticker = searchParams.get("ticker")?.trim().toUpperCase();

        if (!ticker) {
            return NextResponse.json({ error: "Missing parameter: ticker" }, { status: 400 });
        }

        const tickersPath = path.resolve(process.cwd(), "..", "tickers.json");
        const fileContent = await readFile(tickersPath, "utf-8");
        const parsed: TickerMapFile = JSON.parse(fileContent);

        const is_valid = ticker in parsed.tickers;
        return NextResponse.json({ is_valid });
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}