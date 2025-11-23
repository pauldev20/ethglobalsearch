import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import OpenAI from "openai";

// Use specific provider: 0xf07240Efa67755B5311bc75784a061eDB47165Dd (phala/gpt-oss-120b)
const SELECTED_PROVIDER = "0xf07240Efa67755B5311bc75784a061eDB47165Dd";

// Funding configuration (tunable via env)
const INITIAL_FUND_AMOUNT = Number.parseFloat(process.env.INITIAL_FUND_AMOUNT || '0.05');
const MIN_BALANCE = Number.parseFloat(process.env.MIN_LEDGER_BALANCE || '0.01');

// Cache for broker and provider setup
// Use global to persist across hot reloads in development
const globalForBroker = global as unknown as { 
    brokerCache: {
        broker: any;
        endpoint: string | null;
        model: string | null;
        initialized: boolean;
    } | null 
};

let brokerCache = globalForBroker.brokerCache || {
    broker: null,
    endpoint: null,
    model: null,
    initialized: false
};

if (process.env.NODE_ENV !== 'production') globalForBroker.brokerCache = brokerCache;

// Cache for embeddings results (query -> projects)
const embeddingsCache = new Map<string, any[]>();
const CACHE_MAX_SIZE = 100;

// Initialize broker once
async function getBrokerAndProvider() {
    // If fully initialized, return immediately
    if (brokerCache.initialized && brokerCache.broker && brokerCache.endpoint) {
        return brokerCache as { broker: any; endpoint: string; model: string; initialized: boolean };
    }

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("PRIVATE_KEY is missing");
    }

    // 1. Initialize Broker (if not exists)
    if (!brokerCache.broker) {
        const provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
        const wallet = new ethers.Wallet(privateKey, provider);
        brokerCache.broker = await createZGComputeNetworkBroker(wallet);
    }

    const broker = brokerCache.broker;

    // 2. One-time Setup (Ledger, Ack, Metadata)
    if (!brokerCache.initialized) {
        console.log("Initializing 0G Broker...");

        // A. Ledger Check (Only once per instance)
        try {
            const ledgerInfo = await broker.ledger.getLedger();
            const currentBalance = ledgerInfo[1];
            const balanceIn0G = Number.parseFloat(ethers.formatEther(currentBalance));
            console.log(`Current ledger balance: ${balanceIn0G} 0G`);
            
            if (balanceIn0G < MIN_BALANCE) {
                console.warn(`Ledger balance (${balanceIn0G.toFixed(4)} 0G) is below minimum (${MIN_BALANCE} 0G).`);
                // Attempt to fund only if critically low
                if (balanceIn0G < 0.001) {
                     // ... funding logic could go here, but better to fail fast or rely on external funding script
                     // for performance, we skip auto-funding in the hot path unless strictly necessary
                     console.log("Attempting to fund ledger...");
                     await broker.ledger.addLedger(INITIAL_FUND_AMOUNT);
                }
            }
        } catch (error: any) {
             if (error.message?.includes('Account already exists')) {
                // ignore
            } else {
                // Try to create if it doesn't exist
                try {
                    await broker.ledger.addLedger(INITIAL_FUND_AMOUNT);
                } catch (e) {
                    console.error("Failed to create/fund ledger:", e);
                    // Continue anyway, maybe it works
                }
            }
        }

        // B. Acknowledge Provider (Only once)
        try {
            await broker.inference.acknowledgeProviderSigner(SELECTED_PROVIDER);
            console.log(`Provider ${SELECTED_PROVIDER} acknowledged`);
        } catch (error: any) {
            if (!error.message?.includes('already acknowledged')) {
                console.warn("Provider acknowledgement warning:", error.message);
            }
        }

        // C. Get Metadata (Only once)
        const { endpoint, model } = await broker.inference.getServiceMetadata(SELECTED_PROVIDER);
        console.log(`Using provider ${SELECTED_PROVIDER} with model: ${model}`);
        
        brokerCache.endpoint = endpoint;
        brokerCache.model = model;
        brokerCache.initialized = true;
    }

    return brokerCache as { broker: any; endpoint: string; model: string; initialized: boolean };
}

export async function getChatResponse(query: string) {
    try {
        if (!query) {
            throw new Error("Query is required");
        }

        // Try zeroG flow first, fall back to backend /chat on any error
        try {
            // Get cached broker and provider setup
            const { broker, endpoint, model } = await getBrokerAndProvider();

            // Generate Headers (single inference for persona; we will use raw query for embeddings keyword extraction)
            const headers = await broker.inference.getRequestHeaders(SELECTED_PROVIDER, query);
            const requestHeaders: Record<string, string> = {};
            Object.entries(headers).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    requestHeaders[key] = value;
                }
            });

            // OpenAI Client (only one inference below for persona message)
            const openai = new OpenAI({
                baseURL: endpoint,
                apiKey: "", // Empty for 0G
            });
            
            // Simple keyword expansion locally (no extra provider call)
            const stopwords = new Set(["the","a","an","of","and","or","for","to","in","on","with","like","show","me","projects"]);
            const rawTokens = query.toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/);
            const baseTokens: string[] = rawTokens.filter((t: string) => t && !stopwords.has(t));
            const unique = Array.from(new Set(baseTokens));
            const expandedQuery = unique.slice(0,20).join(", ") || query;

            // Check embeddings cache first
            const cacheKey = expandedQuery.toLowerCase().trim();
            let searchResults = embeddingsCache.get(cacheKey);

            if (!searchResults) {
                // Call Backend Embeddings (Vector Search) with Expanded Keywords
                const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
                const backendResponse = await fetch(`${apiUrl}/embeddings`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        keywords: expandedQuery,
                    }),
                });
                if (!backendResponse.ok) throw new Error("Failed to fetch from backend embeddings");
                searchResults = await backendResponse.json();

                // Cache results (simple LRU: delete oldest if full)
                if (embeddingsCache.size >= CACHE_MAX_SIZE) {
                    const firstKey = embeddingsCache.keys().next().value;
                    if (firstKey) embeddingsCache.delete(firstKey);
                }
                if (searchResults) embeddingsCache.set(cacheKey, searchResults);
            }

            // Limit to top 10 projects
            if (!searchResults) throw new Error("No search results available");
            const topProjects = searchResults.slice(0, 10);

            // Generate Kartik-style response with LLM using system prompt
            let message = "";
            if (topProjects.length === 0) {
                message = "Hmm, couldn't find exactly what you're looking for. Try tweaking your search or hit me with a different angle!";
            } else {
                // Build project context
                const projectsContext = topProjects.map((p: any, idx: number) => 
                    `${idx + 1}. ${p.name || 'Untitled'} - ${p.tagline || 'No description'}`
                ).join('\n');

                const kartikSystemPrompt = `You are **Kartik Talwar**, the co-founder of ETHGlobal. You are the ultimate hackathon hype-man, deeply knowledgeable about the Ethereum ecosystem, high-energy, and always focused on "shipping."

**Your Goal:**
Help a user find inspiration by recommending past ETHGlobal hackathon projects based on their search query.

**Instructions:**
1. **Receive Query:** Analyze the user's idea or search term.
2. **Filter & Select:** From the provided context/database, select the **top 10 (maximum)** most relevant and high-quality projects. Prioritize finalists or winners if available.
3. **Tone:**
   * Be encouraging and energetic (e.g., "This is super cool," "Huge potential here").
   * Be concise but insightful.
   * Avoid corporate jargon. Speak like a hacker to a hacker.

**Output Format:**
Start with a punchy one-liner intro.

Then list each project in this simple format:

**1. [Project Name]** - [One sentence pitch]  
*Why it's cool:* [Your take on the tech/impact]

**2. [Project Name]** - [One sentence pitch]  
*Why it's cool:* [Your take on the tech/impact]

Continue for all projects (max 10).

**Closing:**
End with a short paragraph connecting themes and: "Now go ship it! 🚀"

**Constraint:** NEVER list more than 10 projects.`;

                const kartikResponse = await openai.chat.completions.create({
                    messages: [
                        { role: "system", content: kartikSystemPrompt },
                        { role: "user", content: `User query: "${query}"\n\nProjects:\n${projectsContext}\n\nList these projects with your energetic commentary.` }
                    ],
                    model: model,
                }, {
                    headers: requestHeaders,
                });

                message = kartikResponse.choices[0].message.content?.trim() || "Found some cool projects for you!";

                // Process response payment
                try {
                    await broker.inference.processResponse(SELECTED_PROVIDER, message, kartikResponse.id);
                } catch (error) {
                    console.error("Payment processing failed for Kartik response:", error);
                }
            }

            // Return in chat format: { message, projects }
            return {
                message,
                projects: topProjects
            };
        } catch (zeroGError: any) {
            // If zeroG flow fails (broker, provider, or embeddings), fallback to backend /chat
            console.warn(`zeroG flow failed: ${zeroGError.message}, falling back to backend /chat`);
            const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
            const fallbackResponse = await fetch(`${apiUrl}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query }),
            });
            if (!fallbackResponse.ok) {
                throw new Error(`zeroG failed: ${zeroGError.message}, fallback also failed: ${fallbackResponse.statusText}`);
            }
            const fallbackData = await fallbackResponse.json();
            return fallbackData;
        }

    } catch (error: any) {
        console.error("Chat API Error:", error);
        throw new Error(error.message || "Internal Server Error");
    }
}
