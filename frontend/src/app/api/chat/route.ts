import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import OpenAI from "openai";

// Official 0G providers
const OFFICIAL_PROVIDERS = {
    "llama-3.3-70b-instruct": "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
    "deepseek-r1-70b": "0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3",
    "qwen2.5-vl-72b-instruct": "0x6D233D2610c32f630ED53E8a7Cbf759568041f8f"
};

const INITIAL_FUND_AMOUNT = 0.0001; // Minimal amount for testing

export async function POST(request: Request) {
    try {
        const { query, page = 1, page_size = 50 } = await request.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            console.error("PRIVATE_KEY is missing");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        // Initialize Wallet and Provider
        const provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
        const wallet = new ethers.Wallet(privateKey, provider);

        // Create Broker
        const broker = await createZGComputeNetworkBroker(wallet);

        // Ensure Ledger Account
        try {
            const ledgerInfo = await broker.ledger.getLedger();
            const currentBalance = ledgerInfo[1];
            // We could check balance here, but for now assuming if ledger exists it's okay or we'll fail later
        } catch (error) {
            // Create ledger if it doesn't exist
            await broker.ledger.addLedger(INITIAL_FUND_AMOUNT);
        }

        // List Services and Select Provider
        const services = await broker.inference.listService();
        if (services.length === 0) {
            throw new Error("No 0G services available");
        }

        // Prefer Llama 3 if available, otherwise first one
        const selectedService = services.find((s: any) => s.provider === OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"]) || services[0];
        const selectedProvider = selectedService.provider;

        // Acknowledge Provider
        try {
            await broker.inference.acknowledgeProviderSigner(selectedProvider);
        } catch (error: any) {
            if (!error.message.includes('already acknowledged')) {
                throw error;
            }
        }

        // Get Service Metadata
        const { endpoint, model } = await broker.inference.getServiceMetadata(selectedProvider);

        // Generate Headers
        const headers = await broker.inference.getRequestHeaders(selectedProvider, query);
        const requestHeaders: Record<string, string> = {};
        Object.entries(headers).forEach(([key, value]) => {
            if (typeof value === 'string') {
                requestHeaders[key] = value;
            }
        });

        // OpenAI Client
        const openai = new OpenAI({
            baseURL: endpoint,
            apiKey: "", // Empty for 0G
        });

        // Prompt for Query Expansion
        const systemPrompt = `
      You transform a natural language request into an expanded list of search keywords.
      Your job is to:
      - extract the core concepts
      - expand them with synonyms, related categories, and domain-relevant terms
      - include both specific and broad variants
      - output 8-20 search tokens
      - avoid stopwords and filler words
      - return ONLY a comma-separated list of search keywords. No sentences.
      
      For example, if the user asks "Show me projects like Facebook",
      you should output keywords like:
      social media, messaging, social network, chat app, community platform, user profiles, feed, timeline, friends list, photo sharing, real-time updates
    `;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: query }
            ],
            model: model,
        }, {
            headers: requestHeaders,
        });

        const expandedQuery = completion.choices[0].message.content?.trim() || query;
        const chatId = completion.id;

        // Process Response (Payment)
        try {
            await broker.inference.processResponse(selectedProvider, expandedQuery, chatId);
        } catch (error) {
            console.error("Payment processing failed:", error);
            // Continue anyway as we have the response
        }

        // Call Backend Embeddings (Vector Search) with Expanded Keywords
        const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/embeddings`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                keywords: expandedQuery,
            }),
        });

        if (!backendResponse.ok) {
            throw new Error("Failed to fetch from backend embeddings");
        }

        const searchResults = await backendResponse.json();

        // Wrap in pagination structure as expected by frontend
        return NextResponse.json({
            results: searchResults,
            pagination: {
                page: 1,
                page_size: searchResults.length,
                total: searchResults.length,
                total_pages: 1
            }
        });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
