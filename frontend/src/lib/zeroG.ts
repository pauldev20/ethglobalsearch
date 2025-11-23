import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import OpenAI from "openai";

const OFFICIAL_PROVIDERS = {
    "llama-3.3-70b-instruct": "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
    "deepseek-r1-70b": "0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3",
    "qwen2.5-vl-72b-instruct": "0x6D233D2610c32f630ED53E8a7Cbf759568041f8f"
};

// Singleton instances to reuse across requests in the same container
let brokerInstance: any = null;
let walletInstance: ethers.Wallet | null = null;
const metadataCache: Record<string, { endpoint: string, model: string }> = {};
const acknowledgedProviders = new Set<string>();

async function getBroker() {
    if (brokerInstance) return { broker: brokerInstance, wallet: walletInstance! };

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error("PRIVATE_KEY is missing");

    // Use the testnet RPC
    const provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
    walletInstance = new ethers.Wallet(privateKey, provider);
    
    // Create the broker instance
    brokerInstance = await createZGComputeNetworkBroker(walletInstance);
    
    return { broker: brokerInstance, wallet: walletInstance };
}

export async function expandQueryWith0G(query: string): Promise<string> {
    try {
        const { broker } = await getBroker();
        
        // Use the preferred provider directly to avoid listing services (saves 1 RPC call)
        const selectedProvider = OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"];

        // 1. Acknowledge Provider (Once per instance)
        // This skips the call if we've already done it in this instance.
        if (!acknowledgedProviders.has(selectedProvider)) {
            try {
                await broker.inference.acknowledgeProviderSigner(selectedProvider);
                acknowledgedProviders.add(selectedProvider);
            } catch (error: any) {
                // If already acknowledged, we can safely ignore and mark as done
                if (error.message && error.message.includes('already acknowledged')) {
                    acknowledgedProviders.add(selectedProvider);
                } else {
                    console.warn("Provider acknowledgement warning:", error);
                }
            }
        }

        // Note: We have removed the automatic ledger check and fund transfer from the hot path.
        // The wallet and provider account should be pre-funded. 
        // Performing on-chain transactions (transferFund) on every request causes the 20s delay.

        // 2. Get Service Metadata (Cached)
        // This saves a call to get the endpoint and model name
        if (!metadataCache[selectedProvider]) {
             const metadata = await broker.inference.getServiceMetadata(selectedProvider);
             metadataCache[selectedProvider] = metadata;
        }
        const { endpoint, model } = metadataCache[selectedProvider];

        // 3. Generate Headers (Must be fresh for every request)
        const headers = await broker.inference.getRequestHeaders(selectedProvider, query);
        const requestHeaders: Record<string, string> = {};
        Object.entries(headers).forEach(([key, value]) => {
            if (typeof value === 'string') {
                requestHeaders[key] = value;
            }
        });

        // 4. OpenAI Request
        const openai = new OpenAI({
            baseURL: endpoint,
            apiKey: "",
        });

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

        // 5. Process Response (Payment)
        // This handles the micropayment. If this fails due to funds, we log it.
        try {
            await broker.inference.processResponse(selectedProvider, expandedQuery, chatId);
        } catch (error) {
            console.error("Payment processing failed:", error);
        }

        return expandedQuery;

    } catch (error) {
        console.error("0G Expansion Error:", error);
        return query; // Fallback
    }
}
