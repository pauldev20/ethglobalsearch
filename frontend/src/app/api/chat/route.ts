import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import { ethers } from "ethers";
import { NextResponse } from "next/server";
import OpenAI from "openai";

// Official 0G providers
const OFFICIAL_PROVIDERS = {
    "llama-3.3-70b-instruct": "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
    "deepseek-r1-70b": "0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3",
    "qwen2.5-vl-72b-instruct": "0x6D233D2610c32f630ED53E8a7Cbf759568041f8f",
};

const INITIAL_FUND_AMOUNT = 0.05; // Initial amount to add to ledger in 0G tokens (reasonable for testnet)
const MIN_BALANCE = 0.01; // Minimum balance required in 0G tokens (0.01 0G should be enough - most of the 0.4 0G is a reservation that gets returned)

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

        // Check wallet balance first (in 0G tokens)
        const walletBalance = await provider.getBalance(wallet.address);
        const walletBalance0G = Number.parseFloat(ethers.formatEther(walletBalance));

        // Create Broker
        const broker = await createZGComputeNetworkBroker(wallet);

        // Ensure Ledger Account with sufficient balance
        let ledgerInfo;
        try {
            ledgerInfo = await broker.ledger.getLedger();
            const currentBalance = ledgerInfo[1];
            const balanceIn0G = Number.parseFloat(ethers.formatEther(currentBalance));

            // Check if balance is sufficient
            if (balanceIn0G < MIN_BALANCE) {
                console.warn(
                    `Ledger balance (${balanceIn0G.toFixed(4)} 0G) is below minimum (${MIN_BALANCE} 0G). The request may fail if insufficient funds.`,
                );
                // Note: To add funds to existing ledger, use the 0G dashboard or transferFund method
                // For now, we'll proceed and let the request fail with a clear error if needed
            }
        } catch (error: any) {
            // Create ledger if it doesn't exist
            // Check if error is because account already exists
            if (error.message?.includes("Account already exists")) {
                ledgerInfo = await broker.ledger.getLedger();
            } else {
                // Create new ledger
                const gasReserve = 0.005; // Reserve 0.005 0G for gas fees
                const availableToAdd = Math.max(0, walletBalance0G - gasReserve);
                const amountToAdd = Math.min(INITIAL_FUND_AMOUNT, availableToAdd);

                if (amountToAdd > 0.001) {
                    await broker.ledger.addLedger(amountToAdd);
                } else {
                    throw new Error(
                        `Insufficient wallet balance. Need at least 0.005 0G for gas + ledger funding. Current balance: ${walletBalance0G.toFixed(4)} 0G`,
                    );
                }
            }
        }

        // List Services and Select Provider
        const services = await broker.inference.listService();
        if (services.length === 0) {
            throw new Error("No 0G services available");
        }
        services.forEach((_s: any, _idx: number) => {});

        // Try to find a provider that's not in the official list (might be cheaper)
        // Or use the first available service
        let selectedService = services.find((s: any) => {
            const isOfficial = Object.values(OFFICIAL_PROVIDERS).includes(s.provider);
            return !isOfficial;
        });

        // If no non-official provider found, try official ones in order of preference
        if (!selectedService) {
            selectedService =
                services.find((s: any) => s.provider === OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"]) ||
                services.find((s: any) => s.provider === OFFICIAL_PROVIDERS["deepseek-r1-70b"]) ||
                services.find((s: any) => s.provider === OFFICIAL_PROVIDERS["qwen2.5-vl-72b-instruct"]) ||
                services[0];
        }

        const selectedProvider = selectedService.provider;

        // Acknowledge Provider
        try {
            await broker.inference.acknowledgeProviderSigner(selectedProvider);
        } catch (error: any) {
            if (!error.message.includes("already acknowledged")) {
                throw error;
            }
        }

        // Transfer funds to provider (try with available balance)
        // Check ledger balance first to see how much we can transfer
        try {
            const currentLedgerInfo = await broker.ledger.getLedger();
            const ledgerBalance = currentLedgerInfo[1];
            const ledgerBalance0G = Number.parseFloat(ethers.formatEther(ledgerBalance));

            // Try to transfer a small amount first (0.01 OG) to see if provider accepts it
            // Some providers might accept less than 1 OG
            const minTransfer = 0.01; // Start with 0.01 OG
            const maxTransfer = 1.0; // Official providers want 1 OG

            if (ledgerBalance0G < minTransfer) {
                console.warn(
                    `Ledger balance (${ledgerBalance0G.toFixed(4)} 0G) is too low. Need at least ${minTransfer} OG. Skipping transfer - request will fail with clear error.`,
                );
            } else {
                // Try with minimum first - if provider needs more, it will fail with clear error
                const transferAmount =
                    ledgerBalance0G >= maxTransfer
                        ? ethers.parseEther(maxTransfer.toString()) // Use 1 OG if available
                        : ethers.parseEther(Math.min(ledgerBalance0G, minTransfer).toString()); // Use what we have, but at least minTransfer
                try {
                    await broker.ledger.transferFund(selectedProvider, "inference", transferAmount);
                } catch (transferError: any) {
                    // If transfer fails due to insufficient amount, try with all available balance
                    if (transferError.message.includes("insufficient") && ledgerBalance0G > minTransfer) {
                        await broker.ledger.transferFund(selectedProvider, "inference", ledgerBalance);
                    } else {
                        throw transferError;
                    }
                }
            }
        } catch (error: any) {
            // If transfer fails, continue anyway - the request will show a clear error if provider needs more funds
            console.warn(`Transfer to provider failed: ${error.message}`);
            // Continue - the API call will fail with a clear error if funds are insufficient
        }

        // Get Service Metadata
        const { endpoint, model } = await broker.inference.getServiceMetadata(selectedProvider);

        // Generate Headers
        const headers = await broker.inference.getRequestHeaders(selectedProvider, query);
        const requestHeaders: Record<string, string> = {};
        Object.entries(headers).forEach(([key, value]) => {
            if (typeof value === "string") {
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

        const completion = await openai.chat.completions.create(
            {
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: query },
                ],
                model: model,
            },
            {
                headers: requestHeaders,
            },
        );

        const expandedQuery = completion.choices[0].message.content?.trim() || query;
        const requestId = completion.id;

        // Process Response (Payment) - must be called after getting the response
        try {
            // processResponse expects: provider, response content (string), requestId (string)
            await broker.inference.processResponse(selectedProvider, expandedQuery, requestId);
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
                total_pages: 1,
            },
        });
    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
